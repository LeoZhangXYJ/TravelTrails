import React, { useEffect, useRef } from 'react';
import { Viewer, Entity, PolylineGraphics, BillboardGraphics } from 'resium';
import { Cartesian3, Color, Math as CesiumMath } from 'cesium';
import { useTravelContext } from '../../context/TravelContext';
import '../../cesiumConfig';

const CesiumMap = () => {
  const { 
    cities, 
    currentCityIndex, 
    isTouring, 
    tourIndex, 
    setTourIndex,
    stopTour 
  } = useTravelContext();
  
  const viewerRef = useRef(null);
  const creditContainerRef = useRef(document.createElement("div")); // 用于隐藏版权信息

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
    if (currentCityIndex < 0 || !cities[currentCityIndex] || !viewerRef.current?.cesiumElement) return;
    
    const viewer = viewerRef.current.cesiumElement;
    const city = cities[currentCityIndex];
    
    // 飞行到当前选中的城市
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        city.coordinates.lon,
        city.coordinates.lat,
        500000
      ),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-90),
        roll: 0.0
      },
      duration: 1.5
    });
  }, [currentCityIndex, cities]);

  // 处理轨迹浏览
  useEffect(() => {
    if (!isTouring || cities.length < 2 || !viewerRef.current?.cesiumElement) return;
    
    const viewer = viewerRef.current.cesiumElement;
    const currentCity = cities[tourIndex];
    const nextCity = cities[(tourIndex + 1) % cities.length];
    
    // 计算飞行时间（基于距离）
    const distance = calculateDistance(
      currentCity.coordinates.lat,
      currentCity.coordinates.lon,
      nextCity.coordinates.lat,
      nextCity.coordinates.lon
    );
    const duration = Math.min(Math.max(distance * 100, 2000), 5000) / 1000; // 2-5秒
    
    // 执行飞行
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        nextCity.coordinates.lon,
        nextCity.coordinates.lat,
        100000
      ),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-90),
        roll: 0.0
      },
      duration: duration,
      complete: () => {
        if (isTouring) {
          // 在城市停留1秒
          setTimeout(() => {
            if (isTouring) {
              // 检查是否完成一轮旅行
              if (tourIndex === cities.length - 2 && nextCity === cities[cities.length - 1]) {
                stopTour(); // 完成一轮旅行后停止
              } else {
                setTourIndex((tourIndex + 1) % cities.length);
              }
            }
          }, 1000);
        }
      }
    });
  }, [isTouring, tourIndex, cities, setTourIndex, stopTour]);

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
        selectionIndicator={false}
        timeline={false}
        navigationHelpButton={false}
        navigationInstructionsInitiallyVisible={false}
      >
        {/* 渲染城市点位 */}
        {cities.map((city, index) => (
          <Entity
            key={`city-${city.id || index}`}
            name={city.name}
            position={Cartesian3.fromDegrees(
              city.coordinates.lon,
              city.coordinates.lat
            )}
          >
            <BillboardGraphics
              image="/marker.png"
              scale={0.08}
              color={index === currentCityIndex || (isTouring && index === tourIndex) 
                ? Color.YELLOW 
                : Color.RED}
            />
          </Entity>
        ))}

        {/* 渲染城市间连线 */}
        {cities.length > 1 &&
          cities.slice(0, -1).map((city, index) => {
            const nextCity = cities[index + 1];
            return (
              <Entity key={`route-${city.id || index}-${nextCity.id || (index + 1)}`}>
                <PolylineGraphics
                  positions={Cartesian3.fromDegreesArray([
                    city.coordinates.lon,
                    city.coordinates.lat,
                    nextCity.coordinates.lon,
                    nextCity.coordinates.lat,
                  ])}
                  width={3}
                  material={
                    isTouring && (index === tourIndex || index === (tourIndex - 1 + cities.length) % cities.length)
                      ? Color.YELLOW.withAlpha(1.0)  // 高亮当前旅行线段
                      : Color.ORANGE.withAlpha(0.8)
                  }
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