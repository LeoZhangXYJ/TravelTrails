import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Viewer, Entity, PolylineGraphics, BillboardGraphics } from 'resium';
import { 
  Cartesian3, Color, Math as CesiumMath, HeightReference, 
  NearFarScalar, ScreenSpaceEventType, defined, 
  ScreenSpaceEventHandler, SampledPositionProperty, TimeIntervalCollection, 
  TimeInterval, JulianDate, ClockRange, ClockStep, BoundingSphere, 
  Cartesian2, Matrix4, Cartographic, VerticalOrigin, 
  UrlTemplateImageryProvider, WebMercatorTilingScheme,
  IonImageryProvider, CesiumTerrainProvider, EllipsoidTerrainProvider, IonResource
} from 'cesium';
import { useTravelContext } from '../../context/TravelContext';
import PhotoOverlay from '../SidePanel/PhotoOverlay';
import '../../cesiumConfig';
import { FaPlane, FaCar, FaWalking, FaBus, FaHome } from 'react-icons/fa';
import { MdOutlineQuestionMark } from "react-icons/md";
import { renderToStaticMarkup } from 'react-dom/server';
import { getRealRoute, getBatchRealRoutes } from '../../services/amapService';
import { transformRouteData, debugCoordinateTransform } from '../../utils/coordinateTransform';

// 交通工具线条材质（简化为5种主要交通方式）
const getPolylineMaterial = (transportMode) => {
  switch (transportMode) {
    case 'plane':
      return Color.PURPLE.withAlpha(0.9); // 飞机：紫色实线
    case 'car':
      return Color.RED.withAlpha(0.9); // 汽车：红色实线
    case 'bus':
      return Color.DARKORANGE.withAlpha(0.9); // 巴士：橙色实线
    case 'walk':
      return Color.MAGENTA.withAlpha(0.9); // 步行：洋红色实线
    default:
      return Color.ORANGE.withAlpha(0.8); // 默认颜色
  }
};

// 获取交通工具图标的函数（简化为5种主要交通方式）
const getTransportIcon = (transportMode) => {
  let IconComponent;
  switch (transportMode) {
    case 'plane':
      IconComponent = FaPlane;
      break;
    case 'car':
      IconComponent = FaCar;
      break;
    case 'bus':
      IconComponent = FaBus;
      break;

    case 'walk':
      IconComponent = FaWalking;
      break;
    case 'home':
      IconComponent = FaHome;
      break;
    default:
      IconComponent = FaHome; // 默认使用汽车图标
  }
  
  // 将 React 组件转换为 SVG 字符串，并设置颜色为醒目的橙红色
  const svgString = renderToStaticMarkup(<IconComponent size={24} color="#ff4500" />);
  // 将 SVG 字符串转换为 data URL
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};

// 获取交通工具图标的样式
const getTransportIconStyle = (isHighlighted = false) => {
  return {
    scale: isHighlighted ? 1.5 : 1.0,
    color: isHighlighted 
      ? Color.fromCssColorString('#ff1493').withAlpha(1.0) // 高亮：深粉色
      : Color.fromCssColorString('#ff4500').withAlpha(1.0), // 正常：橙红色
    verticalOrigin: VerticalOrigin.BOTTOM,
    heightReference: HeightReference.CLAMP_TO_GROUND,
    disableDepthTestDistance: 1000000, // 中层，在一定距离内可见
    scaleByDistance: new NearFarScalar(1.5e6, 1.0, 10.0e6, 0.4),
    translucencyByDistance: new NearFarScalar(1.5e6, 1.0, 10.0e6, 0.4)
  };
};

const TARGET_CITY_HEIGHT = 20000; // 20km
const TARGET_CITY_PITCH = CesiumMath.toRadians(-90); // 正对地面

const GLOBE_VIEW_HEIGHT_INITIAL_ZOOM_OUT = 3e6; // 3000km für initialen Zoom Out auf "Home"
const GLOBE_VIEW_HEIGHT_TRANSITION = 3e6; // 3000km für Übergangs-Zoom Out zwischen Städten

const CesiumMap = ({ currentLayer }) => {
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
  const animationRunning = useRef(false); // 添加动画运行标志
  const currentAnimation = useRef(null); // 存储当前动画的引用
  const allTimeouts = useRef([]); // 存储所有定时器引用
  const cameraFlightInProgress = useRef(false); // 存储相机飞行状态
  
  // 照片播放相关状态
  const [showPhotoOverlay, setShowPhotoOverlay] = useState(false);
  const [currentPhotoCity, setCurrentPhotoCity] = useState(null);
  const [waitingForPhotos, setWaitingForPhotos] = useState(false);

  // 真实路径相关状态
  const [realRoutes, setRealRoutes] = useState({});
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadedCitiesHash, setLoadedCitiesHash] = useState(''); // 缓存已加载的城市hash

  // 加载真实路径数据
  const loadRealRoutes = useCallback(async (citiesData) => {
    if (!citiesData || citiesData.length < 2) {
      setRealRoutes({});
      setLoadedCitiesHash('');
      return;
    }

    // 生成城市数据的hash来判断是否需要重新加载，添加版本号确保巴士路径更新
    const API_VERSION = "v2_bus_fix"; // 更新版本号强制刷新巴士路径
    const currentHash = API_VERSION + JSON.stringify(citiesData.map(city => ({
      name: city.name,
      coordinates: city.coordinates,
      transportMode: city.transportMode
    })));
    
    // 如果数据没有变化，跳过加载
    if (currentHash === loadedCitiesHash && Object.keys(realRoutes).length > 0) {
      console.log('✅ 城市数据未变化，使用缓存的路径数据');
      return;
    }

    // 避免重复加载
    if (loadingRoutes) {
      console.log('⏸️ 路径加载中，跳过重复请求');
      return;
    }

    setLoadingRoutes(true);
    console.log('🚀 开始加载真实路径数据...');
    
    try {
      const sortedCities = getSortedCitiesForTour ? getSortedCitiesForTour() : citiesData;
      const routes = await getBatchRealRoutes(sortedCities);
      
      // 坐标转换：GCJ-02 -> WGS84
      const transformedRoutes = transformRouteData(routes);
      setRealRoutes(transformedRoutes);
      
      // 减少调试输出，只显示转换效果示例
      const routeKeys = Object.keys(routes);
      if (routeKeys.length > 0) {
        const firstKey = routeKeys[0];
        if (routes[firstKey] && transformedRoutes[firstKey]) {
          debugCoordinateTransform(routes[firstKey], transformedRoutes[firstKey], firstKey);
        }
      }
      
      console.log(`✅ 路径数据加载完成，共 ${routeKeys.length} 条路径，坐标已转换为WGS84`);
      
      // 更新缓存hash
      setLoadedCitiesHash(currentHash);
    } catch (error) {
      console.error('❌ 加载真实路径失败:', error);
      // 失败时清空路径数据，将使用直线路径
      setRealRoutes({});
      setLoadedCitiesHash('');
    } finally {
      setLoadingRoutes(false);
    }
  }, [getSortedCitiesForTour]);

  // 当城市数据变化时重新加载路径
  useEffect(() => {
    if (cities && cities.length > 1) {
      // 只在有效的城市数据时加载
      loadRealRoutes(cities);
    } else {
      // 城市数据不足时清空路径
      setRealRoutes({});
      setLoadedCitiesHash('');
    }
  }, [cities, loadRealRoutes]);

  // 添加显示所有交通工具图标和路线的函数
  const displayTransportIconsAndRoutes = useCallback(() => {
    if (!viewerRef.current?.cesiumElement) return;
    
    const viewer = viewerRef.current.cesiumElement;
    const transportModes = ['plane', 'car', 'bus', 'walk'];
    
    // 清除现有的实体
    viewer.entities.removeAll();
    
    // 在固定位置显示所有图标和示例路线
    transportModes.forEach((mode, index) => {
      const startLon = 116.3915 + (index * 0.5);
      const startLat = 39.9053;
      const endLon = startLon + 0.2;
      const endLat = startLat + 0.2;
      
      // 添加图标
      viewer.entities.add({
        name: mode,
        position: Cartesian3.fromDegrees(startLon, startLat),
        billboard: {
          image: getTransportIcon(mode),
          verticalOrigin: VerticalOrigin.BOTTOM,
          scale: 1.0,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          color: Color.WHITE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          pixelOffset: new Cartesian2(0, -10)
        }
      });
      
      // 添加路线
      viewer.entities.add({
        name: `${mode}_route`,
        polyline: {
          positions: Cartesian3.fromDegreesArray([
            startLon, startLat,
            endLon, endLat
          ]),
          width: 2,
          material: getPolylineMaterial(mode),
          clampToGround: true
        }
      });
    });

    // 设置相机视角以查看所有图标
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(116.3915, 39.9053, 100000),
      orientation: {
        heading: 0.0,
        pitch: -CesiumMath.PI_OVER_TWO,
        roll: 0.0
      },
      duration: 0
    });
  }, []);

  // 在组件挂载和图层切换时显示图标和路线
  useEffect(() => {
    if (viewerRef.current?.cesiumElement) {
      displayTransportIconsAndRoutes();
    }
  }, [displayTransportIconsAndRoutes, currentLayer]);

  // 修改初始化 viewer 的代码
  useEffect(() => {
    if (!viewerRef.current || !viewerRef.current.cesiumElement) return;
    
    const viewer = viewerRef.current.cesiumElement;
    
    // 设置初始视角
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(116.3915, 39.9053, 100000),
      orientation: {
        heading: 0.0,
        pitch: -CesiumMath.PI_OVER_TWO,
        roll: 0.0
      }
    });

    // 设置一些优化选项
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.baseColor = Color.WHITE;
    viewer.scene.globe.atmosphereBrightnessShift = 0.2;
    viewer.scene.globe.atmosphereSaturationShift = 0.8;
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
      console.log('检测到停止浏览，开始清理');
      setInitialTourFlightPerformed(false);
      
      // 完全清理所有动画和定时器
      stopAllAnimationsAndTimers();
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
    
    // 调整动画时长参数 - 大幅加快速度
    const distance = calculateDistance(
        currentTravelCity.coordinates.lat, currentTravelCity.coordinates.lon,
        nextTravelCity.coordinates.lat, nextTravelCity.coordinates.lon
    );
    const phaseDuration = Math.min(Math.max(distance * 10, 800), 2000) / 1000; // 加快：0.8s - 2s pro Phase
    const cityStayDuration = 500; // 减少城市停留时间到0.5秒

    const performTwoStageFlight = (fromCity, toCity, onComplete) => {
      // Add checks inside performTwoStageFlight as well, as it's a critical part
      if (!fromCity || !fromCity.coordinates || typeof fromCity.coordinates.lat !== 'number' || typeof fromCity.coordinates.lon !== 'number' ||
          !toCity || !toCity.coordinates || typeof toCity.coordinates.lat !== 'number' || typeof toCity.coordinates.lon !== 'number') {
        console.warn("CesiumMap Tour: performTwoStageFlight received city with invalid coordinates", { fromCity, toCity });
        stopTour();
        return;
      }

      // 如果不在浏览状态，立即返回
      if (!isTouring) {
        console.log('不在浏览状态，取消飞行');
        return;
      }

      // 清理之前的移动图标
      stopAllAnimationsAndTimers();

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
      cameraFlightInProgress.current = true;
      viewer.camera.flyTo({
          destination: overviewDestination,
          orientation: overviewOrientation,
          duration: phaseDuration * 0.2, // 进一步缩短相机移动时间
          complete: () => {
              cameraFlightInProgress.current = false;
              if (!isTouring) {
                console.log('浏览已停止，取消后续动画');
                return;
              }
              
              // 减少等待时间
              const timeout1 = setTimeout(() => {
                if (!isTouring) {
                  console.log('浏览已停止，取消图标移动');
                  return;
                }
                
                console.log('相机到位，开始图标移动');
                // 第二阶段：启动图标移动，相机保持不动
                const iconMovementDuration = phaseDuration * 1.6; // 增加图标移动时间占比
                startMovingIconAlongTrajectory(fromCity, toCity, toCity.transportMode, iconMovementDuration, tourIndex);
                
                // 等待图标移动完成
                const timeout2 = setTimeout(() => {
                  if (!isTouring) {
                    console.log('浏览已停止，取消相机缩放');
                    return;
                  }
                  
                  // 停止图标移动
                  stopAllAnimationsAndTimers();
                  
                  // 第三阶段：放大到目标城市
                  cameraFlightInProgress.current = true;
                  viewer.camera.flyTo({
                      destination: finalDestination,
                      orientation: finalOrientation, 
                      duration: phaseDuration * 0.2, // 进一步缩短相机移动时间
                      complete: () => {
                        cameraFlightInProgress.current = false;
                        if (!isTouring) return;
                        
                        // 到达目标城市后，先播放照片（如果有），再执行完成回调
                        startCityPhotoShow(toCity, () => {
                          if (isTouring && onComplete) {
                            onComplete();
                          }
                        });
                      }
                  });
                }, iconMovementDuration * 1000);
                allTimeouts.current.push(timeout2);
              }, 100); // 减少等待时间到100ms
              allTimeouts.current.push(timeout1);
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
              const homeStayTimeout = setTimeout(() => {
                if (!isTouring) return;
                
                // 在Home城市播放照片（如果有）
                startCityPhotoShow(sortedCities[0], () => {
                  if (!isTouring) return;
                  
                  // Starte den normalen Zwei-Phasen-Flug von Home zum ersten Reiseziel
                  performTwoStageFlight(sortedCities[0], nextTravelCity, () => {
                    if (!isTouring) return;
                    const nextTimeout = setTimeout(() => {
                      if (!isTouring) return;
                      if (sortedCities.length <= 2 && tourIndex === 0) { // Spezialfall: Home + 1 Ziel
                          stopTour();
                      } else {
                          setTourIndex(nextTravelActualIndex);
                      }
                    }, cityStayDuration);
                    allTimeouts.current.push(nextTimeout);
                  });
                });
              }, cityStayDuration); // Am "Home" Punkt verweilen
              allTimeouts.current.push(homeStayTimeout);
            }
          });
        }
      });
    } else {
      // Normaler Zwei-Phasen-Flug für alle anderen Segmente
      performTwoStageFlight(currentTravelCity, nextTravelCity, () => {
        if (!isTouring) return;
        const stayTimeout = setTimeout(() => {
          if (!isTouring) return;
          if (tourIndex === sortedCities.length - 2) { 
            stopTour();
          } else {
            setTourIndex(nextTravelActualIndex);
          }
        }, cityStayDuration);
        allTimeouts.current.push(stayTimeout);
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

    // 移动图标贴地，但在最上层
    const startPosition = Cartesian3.fromDegrees(
      fromCity.coordinates.lon,
      fromCity.coordinates.lat
    );
    const endPosition = Cartesian3.fromDegrees(
      toCity.coordinates.lon,
      toCity.coordinates.lat
    );

    // 创建移动实体
    const movingEntity = {
      id: 'moving-transport-icon',
      position: startPosition, // 初始位置
      billboard: {
        image: getTransportIcon(transportMode),
        scale: 0.8, // 调小移动图标的尺寸
        color: Color.WHITE,
        verticalOrigin: VerticalOrigin.BOTTOM,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 最上层，永远可见
        scaleByDistance: new NearFarScalar(1.5e6, 2.0, 10.0e6, 0.8),
        translucencyByDistance: new NearFarScalar(1.5e6, 1.0, 10.0e6, 0.6)
      }
    };

    return { entity: movingEntity, startPosition, endPosition, duration };
  };

  // 启动移动图标，严格沿着轨迹线移动
  const startMovingIconAlongTrajectory = (fromCity, toCity, transportMode, duration, currentTourIndex = tourIndex) => {
    if (!viewerRef.current?.cesiumElement || !isTouring) return;
    
    const viewer = viewerRef.current.cesiumElement;
    const iconData = createMovingIcon(fromCity, toCity, transportMode, viewer, duration);
    
    if (iconData) {
      // 先清理可能存在的旧图标
      const existingEntity = viewer.entities.getById('moving-transport-icon');
      if (existingEntity) {
        viewer.entities.remove(existingEntity);
        console.log('清理旧图标');
      }
      
      // 添加新图标实体到viewer
      const addedEntity = viewer.entities.add({
        id: iconData.entity.id,
        position: iconData.entity.position,
        billboard: iconData.entity.billboard
      });
      
      console.log('新图标已添加:', addedEntity.id);
      
      setMovingIcon(iconData.entity);
      setCurrentTransportMode(transportMode);
      
      // 获取真实路径或使用直线路径
      const sortedCities = getSortedCitiesForTour();
      
      // 使用当前的tourIndex来确定路径键
      const currentRouteIndex = currentTourIndex;
      const routeKey = `${currentRouteIndex}-${currentRouteIndex + 1}`;
      
      // 调试信息
      console.log('移动图标路径查找:');
      console.log('- fromCity:', fromCity.name);
      console.log('- toCity:', toCity.name);
             console.log('- tourIndex:', currentTourIndex);
      console.log('- 使用路径键:', routeKey);
      console.log('- 可用路径数据:', Object.keys(realRoutes));
      
      const realRoute = realRoutes[routeKey];
      console.log('- 找到路径:', !!realRoute, realRoute ? `(${realRoute.length}个点)` : '');
      
      let routeCoordinates = [];
      if (realRoute && realRoute.length >= 2) {
        // 使用真实路径数据（已经过坐标转换）- 允许2个点的路径
        routeCoordinates = realRoute.map(coord => ({
          lon: coord[0],
          lat: coord[1]
        }));
        console.log(`✅ 使用真实路径 ${routeKey}，共 ${routeCoordinates.length} 个点 (WGS84坐标)`);
        if (routeCoordinates.length <= 3) {
          console.log('完整路径数据:', routeCoordinates);
        } else {
          console.log('路径起点:', routeCoordinates[0]);
          console.log('路径终点:', routeCoordinates[routeCoordinates.length - 1]);
          // 显示路径中间几个点来验证数据
          const midIndex = Math.floor(routeCoordinates.length / 2);
          console.log('路径中点:', routeCoordinates[midIndex]);
        }
      } else {
        // 使用城市坐标作为直线路径
        routeCoordinates = [
          { lon: fromCity.coordinates.lon, lat: fromCity.coordinates.lat },
          { lon: toCity.coordinates.lon, lat: toCity.coordinates.lat }
        ];
        console.log(`⚠️ 使用城市直线路径 ${routeKey}，路径数据不可用或为空`);
      }
      
      // 智能调整步数：短路径少步数，长路径也不会太多步数
      const steps = routeCoordinates.length <= 3 
        ? 60  // 直线或短路径：60步
        : 120; // 真实路径：120步，无论多少个点
      const stepDuration = (duration * 1000) / steps; // 每步的时间（毫秒）
      // 移动图标贴地移动
      
      console.log(`🚀 动画参数: 路径${routeCoordinates.length}点 → ${steps}步, 每步${stepDuration.toFixed(1)}ms, 总时长${duration}s`);
      let currentStep = 0;
      
      // 设置动画运行标志
      animationRunning.current = true;
      
      const animateIconAlongTrajectory = () => {
        // 检查动画是否应该停止
        if (!isTouring || !animationRunning.current || currentStep >= steps) {
          console.log('动画结束或被强制停止');
          animationRunning.current = false;
          // 确保清理图标
          if (viewer.entities.getById('moving-transport-icon')) {
            viewer.entities.removeById('moving-transport-icon');
          }
          return;
        }
        
        const progress = currentStep / steps;
        
        // 根据progress计算当前应该在路径的哪个位置
        let currentLon, currentLat;
        
        if (routeCoordinates.length <= 2) {
          // 直线路径：简单插值
          const startCoord = routeCoordinates[0];
          const endCoord = routeCoordinates[routeCoordinates.length - 1];
          
          currentLon = startCoord.lon + (endCoord.lon - startCoord.lon) * progress;
          currentLat = startCoord.lat + (endCoord.lat - startCoord.lat) * progress;
        } else {
          // 真实路径：沿着路径点插值
          const totalSegments = routeCoordinates.length - 1;
          const targetSegmentFloat = progress * totalSegments;
          const targetSegment = Math.floor(targetSegmentFloat);
          const segmentProgress = targetSegmentFloat - targetSegment;
          
          // 防止索引超出范围
          const fromIdx = Math.min(targetSegment, routeCoordinates.length - 2);
          const toIdx = Math.min(fromIdx + 1, routeCoordinates.length - 1);
          
          const fromCoord = routeCoordinates[fromIdx];
          const toCoord = routeCoordinates[toIdx];
          
          // 在当前路径段内插值
          currentLon = fromCoord.lon + (toCoord.lon - fromCoord.lon) * segmentProgress;
          currentLat = fromCoord.lat + (toCoord.lat - fromCoord.lat) * segmentProgress;
          
          // 偶尔输出调试信息
          if (currentStep % 20 === 0) {
            console.log(`🎯 图标沿轨迹移动: 进度${Math.round(progress * 100)}%, 段${fromIdx}-${toIdx}, 坐标(${currentLon.toFixed(4)}, ${currentLat.toFixed(4)}), 贴地移动`);
          }
        }
        
        // 创建最终位置（贴地）
        const currentPosition = Cartesian3.fromDegrees(
          currentLon, 
          currentLat
        );
        
        // 使用更可靠的实体更新方式
        const entity = viewer.entities.getById('moving-transport-icon');
        if (entity && animationRunning.current && isTouring) {
          entity.position = currentPosition;
          if (currentStep % 15 === 0) { // 每15步打印一次调试信息
            console.log('📍 图标移动进度:', Math.round(progress * 100) + '%');
          }
        } else if (!entity && animationRunning.current && isTouring) {
          console.error('图标实体丢失，尝试重新创建');
          // 尝试重新添加图标
          viewer.entities.add({
            id: 'moving-transport-icon',
            position: currentPosition,
            billboard: iconData.entity.billboard
          });
        }
        
        currentStep++;
        if (currentStep < steps && animationRunning.current && isTouring) {
          // 存储定时器引用，以便可以取消
          currentAnimation.current = setTimeout(animateIconAlongTrajectory, stepDuration);
        } else {
          console.log('图标动画自然完成或被停止');
          animationRunning.current = false;
        }
      };
      
      // 开始动画
      const startTimeout = setTimeout(() => {
        if (isTouring) {
          console.log('开始图标轨迹移动动画');
          animateIconAlongTrajectory();
        }
      }, 50); // 减少等待时间到50ms
      allTimeouts.current.push(startTimeout);
    }
  };

  // 停止所有动画和定时器的统一方法
  const stopAllAnimationsAndTimers = () => {
    console.log('强制停止所有动画和定时器');
    
    // 立即设置动画停止标志
    animationRunning.current = false;
    cameraFlightInProgress.current = false;
    
    // 清理照片播放状态
    setShowPhotoOverlay(false);
    setCurrentPhotoCity(null);
    setWaitingForPhotos(false);
    if (window.photoPlaybackComplete) {
      window.photoPlaybackComplete = null;
    }
    
    // 清除当前动画定时器
    if (currentAnimation.current) {
      clearTimeout(currentAnimation.current);
      currentAnimation.current = null;
    }
    
    // 清除所有存储的定时器
    allTimeouts.current.forEach(timeout => {
      if (timeout) {
        clearTimeout(timeout);
      }
    });
    allTimeouts.current = [];
    
    if (!viewerRef.current?.cesiumElement) return;
    
    const viewer = viewerRef.current.cesiumElement;
    
    // 取消正在进行的相机飞行
    viewer.camera.cancelFlight();
    
    // 多重清理确保彻底移除图标
    const entity = viewer.entities.getById('moving-transport-icon');
    if (entity) {
      viewer.entities.remove(entity);
      console.log('图标已移除');
    }
    
    // 也尝试通过ID移除（双重保险）
    try {
      viewer.entities.removeById('moving-transport-icon');
    } catch (e) {
      // 忽略错误，可能实体已经被移除
    }
    
    setMovingIcon(null);
    setCurrentTransportMode(null);
    
    console.log('所有动画、定时器和照片播放状态已清理');
  };

  // 停止移动图标和摄像机跟随（保留原方法名以兼容）
  const stopMovingIcon = () => {
    stopAllAnimationsAndTimers();
  };

  // 检查城市是否有照片需要播放
  const cityHasPhotos = (city) => {
    return city && city.photos && Array.isArray(city.photos) && city.photos.length > 0;
  };

  // 开始播放城市照片
  const startCityPhotoShow = (city, onComplete) => {
    if (!cityHasPhotos(city)) {
      // 如果没有照片，直接继续
      if (onComplete) onComplete();
      return;
    }

    console.log(`开始播放 ${city.name} 的照片，共 ${city.photos.length} 张`);
    setCurrentPhotoCity(city);
    setShowPhotoOverlay(true);
    setWaitingForPhotos(true);
    
    // 存储完成回调
    window.photoPlaybackComplete = onComplete;
  };

  // 照片播放完成的处理
  const handlePhotoOverlayClose = () => {
    console.log('照片播放完成');
    setShowPhotoOverlay(false);
    setCurrentPhotoCity(null);
    setWaitingForPhotos(false);
    
    // 执行存储的回调函数
    if (window.photoPlaybackComplete) {
      const callback = window.photoPlaybackComplete;
      window.photoPlaybackComplete = null;
      
      // 短暂延迟后继续轨迹，确保照片关闭动画完成
      setTimeout(() => {
        if (isTouring && callback) {
          callback();
        }
      }, 400);
    }
  };

  return (
    <div id="cesiumContainer" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 加载真实路径的指示器 */}
      {loadingRoutes && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          正在加载真实路径数据...
        </div>
      )}
      
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
          
          const iconStyle = getTransportIconStyle(isHighlighted);
          
          return (
            <Entity
              key={`city-entity-${city.id || index}`}
              id={`city-${city.id}`}
              name={city.name}
              position={Cartesian3.fromDegrees(
                city.coordinates.lon,
                city.coordinates.lat
              )}
              billboard={{
                image: getTransportIcon(city.transportMode || 'home'),
                ...iconStyle
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
            // 在轨迹浏览模式下高亮当前路径
            if (isTouring && index === tourIndex) { 
              // 所有路径都使用实线高亮
              material = Color.ORANGE.withAlpha(1.0);
            }

            // 获取真实路径或使用直线路径
            const routeKey = `${index}-${index + 1}`;
            const realRoute = realRoutes[routeKey];
            
            let positions;
            if (realRoute && realRoute.length > 2) {
              // 使用真实路径数据
              const coords = [];
              realRoute.forEach(coord => {
                coords.push(coord[0], coord[1]); // [lon, lat]
              });
              positions = Cartesian3.fromDegreesArray(coords);
            } else {
              // 使用直线路径（原来的逻辑）
              positions = Cartesian3.fromDegreesArray([
                city.coordinates.lon, city.coordinates.lat,
                nextCity.coordinates.lon, nextCity.coordinates.lat,
              ]);
            }

            return (
              <Entity key={`route-${city.id || index}-${nextCity.id || (index + 1)}`}>
                <PolylineGraphics
                  positions={positions}
                  width={nextCity.transportMode === 'plane' ? 6 : 5}
                  material={material}
                  clampToGround={true}
                  depthFailMaterial={material}
                />
              </Entity>
            );
          });
        })()}
        
        {/* 移动图标现在直接通过viewer.entities.add添加，不需要在这里渲染 */}
      </Viewer>
      
      {/* 轨迹浏览时的照片播放覆盖层 */}
      {showPhotoOverlay && currentPhotoCity && (
        <PhotoOverlay
          photos={currentPhotoCity.photos}
          cityName={currentPhotoCity.name}
          country={currentPhotoCity.country}
          onClose={handlePhotoOverlayClose}
          sidebarWidth={0} // 在轨迹浏览时，照片居中显示
        />
      )}
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