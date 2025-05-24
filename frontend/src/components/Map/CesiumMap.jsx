import React, { useEffect, useRef, useState } from 'react';
import { Viewer, Entity, PolylineGraphics, BillboardGraphics } from 'resium';
import { Cartesian3, Color, Math as CesiumMath, HeightReference, NearFarScalar, ScreenSpaceEventType, defined, PolylineDashMaterialProperty, ScreenSpaceEventHandler, SampledPositionProperty, TimeIntervalCollection, TimeInterval, JulianDate, ClockRange, ClockStep, BoundingSphere, Cartesian2, Matrix4 } from 'cesium';
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

// 获取交通工具图标的函数
const getTransportIcon = (transportMode) => {
  // 使用 Unicode 字符作为图标，因为它们在所有系统上都可用
  switch (transportMode) {
    case 'plane':
      return '✈️';
    case 'train':
      return '🚂';
    case 'car':
      return '🚗';
    case 'bus':
      return '🚌';
    case 'boat':
      return '🚢';
    case 'bicycle':
      return '🚴';
    case 'walk':
      return '🚶';
    default:
      return '🚀';
  }
};

const TARGET_CITY_HEIGHT = 20000; // 20km
const TARGET_CITY_PITCH = CesiumMath.toRadians(-90); // 正对地面

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
    selectCityById,
    getSortedCitiesForTour,
    getOriginalIndexFromSortedCity
  } = useTravelContext();
  
  const viewerRef = useRef(null);
  const creditContainerRef = useRef(document.createElement("div")); // 用于隐藏版权信息
  const [initialTourFlightPerformed, setInitialTourFlightPerformed] = useState(false);
  const prevIsTouring = useRef(isTouring);
  const [movingIcon, setMovingIcon] = useState(null);
  const [currentTransportMode, setCurrentTransportMode] = useState(null);

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
    
    // 保持默认的导航控件启用，用户可以自由操作地图
    // 注释掉禁用导航控件的代码
    // viewer.scene.screenSpaceCameraController.enableRotate = false;
    // viewer.scene.screenSpaceCameraController.enableTranslate = false;
    // viewer.scene.screenSpaceCameraController.enableZoom = false;
    // viewer.scene.screenSpaceCameraController.enableTilt = false;
    // viewer.scene.screenSpaceCameraController.enableLook = false;
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
      // 清理移动图标
      stopMovingIcon();
    }
    prevIsTouring.current = isTouring;
  }, [isTouring]);

  // 处理轨迹浏览
  useEffect(() => {
    if (!isTouring || cities.length < 2 || !viewerRef.current?.cesiumElement) return;
    
    const viewer = viewerRef.current.cesiumElement;
    
    // 使用按日期排序的城市序列
    const sortedCities = getSortedCitiesForTour();
    const currentTravelCity = sortedCities[tourIndex]; 
    const nextTravelActualIndex = (tourIndex + 1) % sortedCities.length;
    const nextTravelCity = sortedCities[nextTravelActualIndex]; 

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
    
    // 调整动画时长参数
    const distance = calculateDistance(
        currentTravelCity.coordinates.lat, currentTravelCity.coordinates.lon,
        nextTravelCity.coordinates.lat, nextTravelCity.coordinates.lon
    );
    const phaseDuration = Math.min(Math.max(distance * 50, 2000), 5000) / 1000; // 增加时长：2s - 5s pro Phase
    const cityStayDuration = 1500; // 增加城市停留时间

    const performTwoStageFlight = (fromCity, toCity, onComplete) => {
      // Add checks inside performTwoStageFlight as well, as it's a critical part
      if (!fromCity || !fromCity.coordinates || typeof fromCity.coordinates.lat !== 'number' || typeof fromCity.coordinates.lon !== 'number' ||
          !toCity || !toCity.coordinates || typeof toCity.coordinates.lat !== 'number' || typeof toCity.coordinates.lon !== 'number') {
        console.warn("CesiumMap Tour: performTwoStageFlight received city with invalid coordinates", { fromCity, toCity });
        stopTour();
        return;
      }

      // 清理之前的移动图标
      stopMovingIcon();

      // 计算包含两个城市的中心点和合适的视角
      const centerLon = (fromCity.coordinates.lon + toCity.coordinates.lon) / 2;
      const centerLat = (fromCity.coordinates.lat + toCity.coordinates.lat) / 2;
      
      // 计算两城市之间的距离，决定合适的观察高度
      const distance = calculateDistance(
        fromCity.coordinates.lat, fromCity.coordinates.lon,
        toCity.coordinates.lat, toCity.coordinates.lon
      );
      
      // 根据距离动态调整观察高度，确保两个城市都在视野内
      const overviewHeight = Math.max(distance * 1000 * 2, 100000); // 至少100km高度
      const overviewDestination = Cartesian3.fromDegrees(centerLon, centerLat, overviewHeight);
      const finalDestination = Cartesian3.fromDegrees(toCity.coordinates.lon, toCity.coordinates.lat, TARGET_CITY_HEIGHT);
      
      // 使用正对地面的视角
      const overviewOrientation = { 
        heading: CesiumMath.toRadians(0), 
        pitch: CesiumMath.toRadians(-90), // 正对地面
        roll: 0.0 
      };
      const finalOrientation = { 
        heading: CesiumMath.toRadians(0), 
        pitch: TARGET_CITY_PITCH, 
        roll: 0.0 
      };

      // 第一阶段：缩小到能看到两个城市的视角
      viewer.camera.flyTo({
          destination: overviewDestination,
          orientation: overviewOrientation,
          duration: phaseDuration * 0.3,
          complete: () => {
              if (!isTouring) return;
              
              // 第二阶段：启动图标移动，相机保持不动
              const iconMovementDuration = phaseDuration * 1.4;
              startMovingIconWithStaticCamera(fromCity, toCity, toCity.transportMode, iconMovementDuration);
              
              // 等待图标移动完成
              setTimeout(() => {
                if (!isTouring) return;
                
                // 停止图标移动
                stopMovingIcon();
                
                // 第三阶段：放大到目标城市
                viewer.camera.flyTo({
                    destination: finalDestination,
                    orientation: finalOrientation, 
                    duration: phaseDuration * 0.3,
                    complete: onComplete
                });
              }, iconMovementDuration * 1000);
          }
      });
    };

    if (tourIndex === 0 && sortedCities[0]?.transportMode === 'home' && !initialTourFlightPerformed) {
      // Spezielle Startanimation für "Home" (需求 1)
      // Ensure homeCity coordinates are valid before starting animation
      if (!sortedCities[0] || !sortedCities[0].coordinates || typeof sortedCities[0].coordinates.lat !== 'number' || typeof sortedCities[0].coordinates.lon !== 'number') {
        console.warn("CesiumMap Tour: homeCity has invalid coordinates for initial animation", sortedCities[0]);
        stopTour();
        return;
      }
      setInitialTourFlightPerformed(true);
      const initialZoomOutDest = Cartesian3.fromDegrees(sortedCities[0].coordinates.lon, sortedCities[0].coordinates.lat, GLOBE_VIEW_HEIGHT_INITIAL_ZOOM_OUT);
      const homeDestination = Cartesian3.fromDegrees(sortedCities[0].coordinates.lon, sortedCities[0].coordinates.lat, TARGET_CITY_HEIGHT);
      const initialOrientation = { heading: CesiumMath.toRadians(0), pitch: CesiumMath.toRadians(-90), roll: 0.0 }; // 正对地面
      const homeOrientation = { heading: CesiumMath.toRadians(0), pitch: TARGET_CITY_PITCH, roll: 0.0 };

      viewer.camera.flyTo({ // Zoom out von aktueller Position auf globale Sicht über Home
        destination: initialZoomOutDest,
        orientation: initialOrientation, // 使用自然的俯视角度
        duration: 1.0, // Dauer für initialen Zoom Out
        complete: () => {
          if (!isTouring) return;
          viewer.camera.flyTo({ // Zoom in auf Home
            destination: homeDestination,
            orientation: homeOrientation,
            duration: 1.0, // Dauer für Zoom In auf Home
            complete: () => {
              if (!isTouring) return;
              setTimeout(() => {
                if (!isTouring) return;
                // Starte den normalen Zwei-Phasen-Flug von Home zum ersten Reiseziel
                performTwoStageFlight(sortedCities[0], nextTravelCity, () => {
                  if (!isTouring) return;
                  setTimeout(() => {
                    if (!isTouring) return;
                    if (sortedCities.length <= 2 && tourIndex === 0) { // Spezialfall: Home + 1 Ziel
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
          if (tourIndex === sortedCities.length - 2) { 
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

  // 创建移动的交通工具图标
  const createMovingIcon = (fromCity, toCity, transportMode, viewer, duration) => {
    if (!fromCity || !toCity || !viewer) return null;

    // 直接使用当前时间，不设置时钟
    const startPosition = Cartesian3.fromDegrees(
      fromCity.coordinates.lon,
      fromCity.coordinates.lat,
      50000 // 提高图标高度，确保可见
    );
    const endPosition = Cartesian3.fromDegrees(
      toCity.coordinates.lon,
      toCity.coordinates.lat,
      50000 // 提高图标高度，确保可见
    );

    // 创建移动实体（不使用时间相关的位置属性）
    const movingEntity = {
      id: 'moving-transport-icon',
      position: startPosition, // 初始位置
      label: {
        text: getTransportIcon(transportMode),
        font: '56pt sans-serif', // 进一步增大字体
        pixelOffset: new Cartesian2(0, -40),
        fillColor: Color.YELLOW, // 使用明亮的黄色，更容易看见
        outlineColor: Color.BLACK,
        outlineWidth: 4, // 更粗的边框
        style: 1, // FILL_AND_OUTLINE
        heightReference: HeightReference.NONE, // 不贴地，保持固定高度
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scale: 2.0, // 增加缩放
        translucencyByDistance: undefined, // 确保在任何距离都可见
        scaleByDistance: undefined // 确保在任何距离都保持大小
      }
    };

    return { entity: movingEntity, startPosition, endPosition, duration };
  };

  // 启动移动图标，相机保持静止
  const startMovingIconWithStaticCamera = (fromCity, toCity, transportMode, duration) => {
    if (!viewerRef.current?.cesiumElement) return;
    
    const viewer = viewerRef.current.cesiumElement;
    const iconData = createMovingIcon(fromCity, toCity, transportMode, viewer, duration);
    
    if (iconData) {
      // 先添加图标实体到viewer
      viewer.entities.add({
        id: iconData.entity.id,
        position: iconData.entity.position,
        label: iconData.entity.label
      });
      
      setMovingIcon(iconData.entity);
      setCurrentTransportMode(transportMode);
      
      // 调整动画参数 - 图标移动时相机保持不动
      const steps = 200; // 平滑的动画步数
      const stepDuration = (duration * 1000) / steps; // 每步的时间（毫秒）
      let currentStep = 0;
      
      const animateIconOnly = () => {
        if (!isTouring || currentStep >= steps) return;
        
        const progress = currentStep / steps;
        
        // 插值经纬度
        const currentLon = fromCity.coordinates.lon + 
          (toCity.coordinates.lon - fromCity.coordinates.lon) * progress;
        const currentLat = fromCity.coordinates.lat + 
          (toCity.coordinates.lat - fromCity.coordinates.lat) * progress;
        
        const currentPosition = Cartesian3.fromDegrees(currentLon, currentLat, 50000);
        
        // 只更新图标位置，不移动相机
        const entity = viewer.entities.getById('moving-transport-icon');
        if (entity) {
          entity.position = currentPosition;
        }
        
        currentStep++;
        if (currentStep < steps) {
          setTimeout(animateIconOnly, stepDuration);
        }
      };
      
      // 开始动画
      animateIconOnly();
    }
  };

  // 停止移动图标和摄像机跟随
  const stopMovingIcon = () => {
    if (!viewerRef.current?.cesiumElement) return;
    
    const viewer = viewerRef.current.cesiumElement;
    viewer.entities.removeById('moving-transport-icon');
    setMovingIcon(null);
    setCurrentTransportMode(null);
  };

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
          
          // 在轨迹浏览时，高亮当前排序后的城市
          let isHighlighted = index === currentCityIndex;
          if (isTouring) {
            const sortedCities = getSortedCitiesForTour();
            const currentTourCity = sortedCities[tourIndex];
            isHighlighted = city.id === currentTourCity?.id;
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
                pixelSize: isHighlighted ? 24 : 18,
                color: isHighlighted 
                  ? Color.fromCssColorString('#ff4500').withAlpha(1.0)
                  : Color.fromCssColorString('#1e90ff').withAlpha(1.0),
                outlineColor: isHighlighted
                  ? Color.YELLOW
                  : Color.WHITE,
                outlineWidth: isHighlighted ? 4 : 3,
                heightReference: HeightReference.CLAMP_TO_GROUND,
                scaleByDistance: new NearFarScalar(1.5e6, 1.0, 10.0e6, 0.4),
                translucencyByDistance: new NearFarScalar(1.5e6, 1.0, 10.0e6, 0.4)
              }}
            />
          );
        })}

        {/* 渲染城市间连线 */}
        {cities.length > 1 && (() => {
          const sortedCities = getSortedCitiesForTour();
          return sortedCities.slice(0, -1).map((city, index) => {
            const nextCity = sortedCities[index + 1];
            // Defensive check for rendering polylines
            if (!city || !city.coordinates || typeof city.coordinates.lat !== 'number' || typeof city.coordinates.lon !== 'number' ||
                !nextCity || !nextCity.coordinates || typeof nextCity.coordinates.lat !== 'number' || typeof nextCity.coordinates.lon !== 'number') {
              console.warn("CesiumMap: Skipping rendering polyline due to invalid coordinates:", { city, nextCity });
              return null; // Don't render this polyline
            }
            let material = getPolylineMaterial(nextCity.transportMode);
            // Hervorhebung der aktiven Route im Tour-Modus
            // Die aktive Route ist die vom aktuellen `tourIndex` zum `(tourIndex + 1) % sortedCities.length`
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
          });
        })()}
        
        {/* 移动图标现在直接通过viewer.entities.add添加，不需要在这里渲染 */}
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