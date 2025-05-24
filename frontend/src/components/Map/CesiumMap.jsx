import React, { useEffect, useRef, useState } from 'react';
import { Viewer, Entity, PolylineGraphics } from 'resium';
import { Cartesian3, Color, Math as CesiumMath, HeightReference, NearFarScalar, ScreenSpaceEventType, defined, PolylineDashMaterialProperty, ScreenSpaceEventHandler } from 'cesium';
import { useTravelContext } from '../../context/TravelContext';
import '../../cesiumConfig';

// Hilfsfunktion zur Bestimmung des Linienmaterials basierend auf dem Transportmittel
const getPolylineMaterial = (transportMode) => {
  switch (transportMode) {
    case 'plane':
      return new PolylineDashMaterialProperty({
        color: Color.DEEPSKYBLUE,
        dashLength: 16.0,
        dashPattern: 255 // Einfaches Muster für gestrichelte Linie (0x00FF)
      });
    case 'train':
      return Color.DARKSLATEGRAY.withAlpha(0.9);
    case 'car':
      return Color.FORESTGREEN.withAlpha(0.9);
    case 'bus':
      return Color.DARKORANGE.withAlpha(0.9);
    case 'boat':
      return new PolylineDashMaterialProperty({
        color: Color.ROYALBLUE,
        dashLength: 20.0,
        dashPattern: 0x0F0F // Muster für Strich-Punkt-Linie o.ä.
      });
    case 'bicycle':
      return new PolylineDashMaterialProperty({
        color: Color.LIMEGREEN,
        dashLength: 8.0,
        gapColor: Color.TRANSPARENT, // Um echte Lücken zu erzeugen
        dashPattern: 0b1111000011110000 // 0xF0F0
      });
    case 'walk':
       return new PolylineDashMaterialProperty({
        color: Color.SANDYBROWN,
        dashLength: 6.0,
        gapColor: Color.TRANSPARENT,
        dashPattern: 0b1010101010101010 // 0xAAAA
      });
    default:
      return Color.ORANGE.withAlpha(0.8); // Standardfarbe
  }
};

const TARGET_CITY_HEIGHT = 20000; // 20km
const TARGET_CITY_PITCH = CesiumMath.toRadians(-90); // 正上方

const GLOBE_VIEW_HEIGHT_INITIAL_ZOOM_OUT = 3e6; // 3000km für initialen Zoom Out auf "Home"
const GLOBE_VIEW_HEIGHT_TRANSITION = 3e6; // 3000km für Übergangs-Zoom Out zwischen Städten

const CesiumMap = () => {
  const { 
    cities, 
    currentCityIndex, 
    isTouring, 
    tourIndex, 
    setTourIndex,
    stopTour,
    selectCityById
  } = useTravelContext();
  
  const viewerRef = useRef(null);
  const creditContainerRef = useRef(document.createElement("div")); // 用于隐藏版权信息
  const [initialTourFlightPerformed, setInitialTourFlightPerformed] = useState(false);
  const prevIsTouring = useRef(isTouring);

  // 初始化Cesium Viewer
  useEffect(() => {
    if (!viewerRef.current || !viewerRef.current.cesiumElement) return;
    
    const viewer = viewerRef.current.cesiumElement;
    // 设置初始视角
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(116.3915, 39.9053, 10000000),
      orientation: {
        heading: 0.0,
        pitch: -CesiumMath.PI_OVER_TWO,
        roll: 0.0
      }
    });
    
    // 禁用默认的导航控件
    viewer.scene.screenSpaceCameraController.enableRotate = false;
    viewer.scene.screenSpaceCameraController.enableTranslate = false;
    viewer.scene.screenSpaceCameraController.enableZoom = false;
    viewer.scene.screenSpaceCameraController.enableTilt = false;
    viewer.scene.screenSpaceCameraController.enableLook = false;
  }, []);

  // 处理选中城市变化时的视角飞行
  useEffect(() => {
    if (isTouring) return; // Nicht ausführen, wenn die Tour aktiv ist, um Konflikte zu vermeiden
    if (currentCityIndex < 0 || !cities[currentCityIndex] || !viewerRef.current?.cesiumElement) return;
    
    const viewer = viewerRef.current.cesiumElement;
    const city = cities[currentCityIndex];

    if (city && city.coordinates && typeof city.coordinates.lon === 'number' && typeof city.coordinates.lat === 'number') {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          city.coordinates.lon,
          city.coordinates.lat,
          TARGET_CITY_HEIGHT 
        ),
        orientation: {
          heading: CesiumMath.toRadians(0),
          pitch: TARGET_CITY_PITCH, 
          roll: 0.0
        },
        duration: 1.0 // Schnellere Flugzeit für manuelle Auswahl
      });
    } else {
      console.warn("CesiumMap: Selected city has invalid coordinates:", city);
    }
  }, [currentCityIndex, cities, isTouring]);

  // Reset initialTourFlightPerformed when tour stops
  useEffect(() => {
    if (!isTouring && prevIsTouring.current) {
      setInitialTourFlightPerformed(false);
    }
    prevIsTouring.current = isTouring;
  }, [isTouring]);

  // 处理轨迹浏览
  useEffect(() => {
    if (!isTouring || cities.length < 2 || !viewerRef.current?.cesiumElement) return;
    
    const viewer = viewerRef.current.cesiumElement;
    const homeCity = cities[0];
    const currentTravelCity = cities[tourIndex]; 
    const nextTravelActualIndex = (tourIndex + 1) % cities.length;
    const nextTravelCity = cities[nextTravelActualIndex]; 

    // Validate coordinates for current and next city in tour
    if (!currentTravelCity || !currentTravelCity.coordinates || typeof currentTravelCity.coordinates.lat !== 'number' || typeof currentTravelCity.coordinates.lon !== 'number') {
      console.warn("CesiumMap Tour: currentTravelCity has invalid coordinates", currentTravelCity);
      stopTour(); // Stop tour if data is invalid
      return;
    }
    if (!nextTravelCity || !nextTravelCity.coordinates || typeof nextTravelCity.coordinates.lat !== 'number' || typeof nextTravelCity.coordinates.lon !== 'number') {
      console.warn("CesiumMap Tour: nextTravelCity has invalid coordinates", nextTravelCity);
      stopTour(); // Stop tour if data is invalid
      return;
    }
    
    // Schnellere Phasendauer (需求 2)
    const distance = calculateDistance(
        currentTravelCity.coordinates.lat, currentTravelCity.coordinates.lon,
        nextTravelCity.coordinates.lat, nextTravelCity.coordinates.lon
    );
    const phaseDuration = Math.min(Math.max(distance * 25, 700), 1500) / 1000; // 0.7s - 1.5s pro Phase
    const cityStayDuration = 800; // Kürzere Verweildauer

    const performTwoStageFlight = (fromCity, toCity, onComplete) => {
      // Add checks inside performTwoStageFlight as well, as it's a critical part
      if (!fromCity || !fromCity.coordinates || typeof fromCity.coordinates.lat !== 'number' || typeof fromCity.coordinates.lon !== 'number' ||
          !toCity || !toCity.coordinates || typeof toCity.coordinates.lat !== 'number' || typeof toCity.coordinates.lon !== 'number') {
        console.warn("CesiumMap Tour: performTwoStageFlight received city with invalid coordinates", { fromCity, toCity });
        stopTour();
        return;
      }

      const intermediateDestination = Cartesian3.fromDegrees(
          (fromCity.coordinates.lon + toCity.coordinates.lon) / 2,
          (fromCity.coordinates.lat + toCity.coordinates.lat) / 2,
          GLOBE_VIEW_HEIGHT_TRANSITION
      );
      const finalDestination = Cartesian3.fromDegrees(
          toCity.coordinates.lon, toCity.coordinates.lat, TARGET_CITY_HEIGHT
      );
      const commonOrientation = { heading: CesiumMath.toRadians(0), pitch: TARGET_CITY_PITCH, roll: 0.0 };
      const globeOrientation = { heading: CesiumMath.toRadians(0), pitch: CesiumMath.toRadians(-90), roll: 0.0 };

      viewer.camera.flyTo({
          destination: intermediateDestination,
          orientation: globeOrientation,
          duration: phaseDuration,
          complete: () => {
              if (!isTouring) return;
              viewer.camera.flyTo({
                  destination: finalDestination,
                  orientation: commonOrientation, 
                  duration: phaseDuration,
                  complete: onComplete
              });
          }
      });
    };

    if (tourIndex === 0 && cities[0]?.transportMode === 'home' && !initialTourFlightPerformed) {
      // Spezielle Startanimation für "Home" (需求 1)
      // Ensure homeCity coordinates are valid before starting animation
      if (!homeCity || !homeCity.coordinates || typeof homeCity.coordinates.lat !== 'number' || typeof homeCity.coordinates.lon !== 'number') {
        console.warn("CesiumMap Tour: homeCity has invalid coordinates for initial animation", homeCity);
        stopTour();
        return;
      }
      setInitialTourFlightPerformed(true);
      const initialZoomOutDest = Cartesian3.fromDegrees(homeCity.coordinates.lon, homeCity.coordinates.lat, GLOBE_VIEW_HEIGHT_INITIAL_ZOOM_OUT);
      const homeDestination = Cartesian3.fromDegrees(homeCity.coordinates.lon, homeCity.coordinates.lat, TARGET_CITY_HEIGHT);
      const commonOrientation = { heading: CesiumMath.toRadians(0), pitch: TARGET_CITY_PITCH, roll: 0.0 };

      viewer.camera.flyTo({ // Zoom out von aktueller Position auf globale Sicht über Home
        destination: initialZoomOutDest,
        orientation: commonOrientation, // Zuerst -90 Grad Pitch beibehalten
        duration: 1.0, // Dauer für initialen Zoom Out
        complete: () => {
          if (!isTouring) return;
          viewer.camera.flyTo({ // Zoom in auf Home
            destination: homeDestination,
            orientation: commonOrientation,
            duration: 1.0, // Dauer für Zoom In auf Home
            complete: () => {
              if (!isTouring) return;
              setTimeout(() => {
                if (!isTouring) return;
                // Starte den normalen Zwei-Phasen-Flug von Home zum ersten Reiseziel
                performTwoStageFlight(homeCity, nextTravelCity, () => {
                  if (!isTouring) return;
                  setTimeout(() => {
                    if (!isTouring) return;
                    if (cities.length <= 2 && tourIndex === 0) { // Spezialfall: Home + 1 Ziel
                        stopTour();
                    } else {
                        setTourIndex(nextTravelActualIndex);
                    }
                  }, cityStayDuration);
                });
              }, cityStayDuration); // Am "Home" Punkt verweilen
            }
          });
        }
      });
    } else {
      // Normaler Zwei-Phasen-Flug für alle anderen Segmente
      performTwoStageFlight(currentTravelCity, nextTravelCity, () => {
        if (!isTouring) return;
        setTimeout(() => {
          if (!isTouring) return;
          if (tourIndex === cities.length - 2) { 
            stopTour();
          } else {
            setTourIndex(nextTravelActualIndex);
          }
        }, cityStayDuration);
      });
    }
  }, [isTouring, tourIndex, cities, setTourIndex, stopTour, initialTourFlightPerformed]);

  // Handler für Klick-Events auf der Karte
  useEffect(() => {
    if (!viewerRef.current || !viewerRef.current.cesiumElement) return;
    const viewer = viewerRef.current.cesiumElement;
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const pickedObject = viewer.scene.pick(movement.position);
      if (defined(pickedObject) && defined(pickedObject.id) && typeof pickedObject.id._id === 'string') {
        if (pickedObject.id._id.startsWith('city-')) {
             const cityId = pickedObject.id._id.substring(5);
             // Beim direkten Anklicken einer Stadt die Tour stoppen und zur Stadt fliegen
             if (isTouring) stopTour(); 
             selectCityById(cityId); // Dies löst den oben stehenden useEffect für currentCityIndex aus
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy(); // Wichtig: Handler beim Unmounten entfernen
    };
  }, [selectCityById, cities, isTouring, stopTour]); // isTouring, stopTour hinzugefügt

  return (
    <div id="cesiumContainer" style={{ width: '100%', height: '100%' }}>
      <Viewer
        ref={viewerRef}
        style={{ width: '100%', height: '100%' }}
        creditContainer={creditContainerRef.current}
        fullscreenButton={false}
        animation={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        infoBox={false}
        sceneModePicker={false}
        selectionIndicator={true}
        timeline={false}
        navigationHelpButton={false}
        navigationInstructionsInitiallyVisible={false}
      >
        {/* 渲染城市点位 */}
        {cities.map((city, index) => {
          // Defensive check for rendering entities
          if (!city || !city.coordinates || typeof city.coordinates.lat !== 'number' || typeof city.coordinates.lon !== 'number') {
            console.warn("CesiumMap: Skipping rendering city due to invalid coordinates:", city);
            return null; // Don't render this entity
          }
          return (
            <Entity
              key={`city-entity-${city.id || index}`}
              id={`city-${city.id}`}
              name={city.name}
              position={Cartesian3.fromDegrees(
                city.coordinates.lon,
                city.coordinates.lat
              )}
              point={{
                pixelSize: index === currentCityIndex || (isTouring && index === tourIndex) ? 24 : 18,
                color: index === currentCityIndex || (isTouring && index === tourIndex) 
                  ? Color.fromCssColorString('#ff4500').withAlpha(1.0)
                  : Color.fromCssColorString('#1e90ff').withAlpha(1.0),
                outlineColor: index === currentCityIndex || (isTouring && index === tourIndex)
                  ? Color.YELLOW
                  : Color.WHITE,
                outlineWidth: index === currentCityIndex || (isTouring && index === tourIndex) ? 4 : 3,
                heightReference: HeightReference.CLAMP_TO_GROUND,
                scaleByDistance: new NearFarScalar(1.5e6, 1.0, 10.0e6, 0.4),
                translucencyByDistance: new NearFarScalar(1.5e6, 1.0, 10.0e6, 0.4)
              }}
            />
          );
        })}

        {/* 渲染城市间连线 */}
        {cities.length > 1 &&
          cities.slice(0, -1).map((city, index) => {
            const nextCity = cities[index + 1];
            // Defensive check for rendering polylines
            if (!city || !city.coordinates || typeof city.coordinates.lat !== 'number' || typeof city.coordinates.lon !== 'number' ||
                !nextCity || !nextCity.coordinates || typeof nextCity.coordinates.lat !== 'number' || typeof nextCity.coordinates.lon !== 'number') {
              console.warn("CesiumMap: Skipping rendering polyline due to invalid coordinates:", { city, nextCity });
              return null; // Don't render this polyline
            }
            let material = getPolylineMaterial(nextCity.transportMode);
            // Hervorhebung der aktiven Route im Tour-Modus
            // Die aktive Route ist die vom aktuellen `tourIndex` zum `(tourIndex + 1) % cities.length`
            if (isTouring && index === tourIndex) { 
              if (nextCity.transportMode === 'plane' || nextCity.transportMode === 'boat' || 
                  nextCity.transportMode === 'bicycle' || nextCity.transportMode === 'walk') {
                 material = new PolylineDashMaterialProperty({
                    color: Color.YELLOW, 
                    dashLength: material.dashLength?.getValue() || 16.0, 
                    dashPattern: material.dashPattern?.getValue() || 255
                 });
              } else {
                material = Color.YELLOW.withAlpha(1.0);
              }
            }

            return (
              <Entity key={`route-${city.id || index}-${nextCity.id || (index + 1)}`}>
                <PolylineGraphics
                  positions={Cartesian3.fromDegreesArray([
                    city.coordinates.lon, city.coordinates.lat,
                    nextCity.coordinates.lon, nextCity.coordinates.lat,
                  ])}
                  width={nextCity.transportMode === 'plane' ? 4 : 3}
                  material={material}
                />
              </Entity>
            );
          })}
      </Viewer>
    </div>
  );
};

// 计算两点之间的距离（km）用于估算飞行时间
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（公里）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

export default CesiumMap;