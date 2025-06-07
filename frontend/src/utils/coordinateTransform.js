/**
 * 坐标转换工具
 * 高德地图API返回的是GCJ-02坐标系（火星坐标系）
 * Cesium使用WGS84坐标系
 * 需要进行坐标转换
 */

const PI = Math.PI;
const X_PI = PI * 3000.0 / 180.0;
const A = 6378245.0; // 长半轴
const EE = 0.00669342162296594323; // 偏心率平方

/**
 * 判断是否在中国境内
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @returns {boolean}
 */
function isInChina(lng, lat) {
  return lng >= 72.004 && lng <= 137.8347 && lat >= 0.8293 && lat <= 55.8271;
}

/**
 * 坐标转换 - 经度转换
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @returns {number}
 */
function transformLng(lng, lat) {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
  return ret;
}

/**
 * 坐标转换 - 纬度转换
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @returns {number}
 */
function transformLat(lng, lat) {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  ret += (20.0 * Math.sin(6.0 * lat * PI) + 20.0 * Math.sin(2.0 * lat * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

/**
 * GCJ-02坐标转WGS84坐标
 * @param {number} lng GCJ-02经度
 * @param {number} lat GCJ-02纬度
 * @returns {Array} [WGS84经度, WGS84纬度]
 */
export function gcj02ToWgs84(lng, lat) {
  if (!isInChina(lng, lat)) {
    return [lng, lat];
  }
  
  let dlat = transformLat(lng - 105.0, lat - 35.0);
  let dlng = transformLng(lng - 105.0, lat - 35.0);
  
  const radlat = lat / 180.0 * PI;
  let magic = Math.sin(radlat);
  magic = 1 - EE * magic * magic;
  const sqrtmagic = Math.sqrt(magic);
  
  dlat = (dlat * 180.0) / ((A * (1 - EE)) / (magic * sqrtmagic) * PI);
  dlng = (dlng * 180.0) / (A / sqrtmagic * Math.cos(radlat) * PI);
  
  const mglat = lat - dlat;
  const mglng = lng - dlng;
  
  return [mglng, mglat];
}

/**
 * WGS84坐标转GCJ-02坐标
 * @param {number} lng WGS84经度
 * @param {number} lat WGS84纬度
 * @returns {Array} [GCJ-02经度, GCJ-02纬度]
 */
export function wgs84ToGcj02(lng, lat) {
  if (!isInChina(lng, lat)) {
    return [lng, lat];
  }
  
  let dlat = transformLat(lng - 105.0, lat - 35.0);
  let dlng = transformLng(lng - 105.0, lat - 35.0);
  
  const radlat = lat / 180.0 * PI;
  let magic = Math.sin(radlat);
  magic = 1 - EE * magic * magic;
  const sqrtmagic = Math.sqrt(magic);
  
  dlat = (dlat * 180.0) / ((A * (1 - EE)) / (magic * sqrtmagic) * PI);
  dlng = (dlng * 180.0) / (A / sqrtmagic * Math.cos(radlat) * PI);
  
  const mglat = lat + dlat;
  const mglng = lng + dlng;
  
  return [mglng, mglat];
}

/**
 * 批量转换GCJ-02坐标到WGS84
 * @param {Array} coordinates 坐标数组 [[lng, lat], [lng, lat], ...]
 * @returns {Array} 转换后的坐标数组
 */
export function batchGcj02ToWgs84(coordinates) {
  if (!Array.isArray(coordinates)) {
    return coordinates;
  }
  
  return coordinates.map(coord => {
    if (Array.isArray(coord) && coord.length >= 2) {
      const [lng, lat] = gcj02ToWgs84(coord[0], coord[1]);
      return [lng, lat];
    }
    return coord;
  });
}

/**
 * 转换路径数据中的坐标
 * @param {Object} routeData 路径数据对象
 * @returns {Object} 转换后的路径数据
 */
export function transformRouteData(routeData) {
  const transformedData = {};
  
  Object.keys(routeData).forEach(key => {
    const route = routeData[key];
    if (Array.isArray(route)) {
      transformedData[key] = batchGcj02ToWgs84(route);
    } else {
      transformedData[key] = route;
    }
  });
  
  return transformedData;
}

/**
 * 调试函数：显示坐标转换前后的差异
 * @param {Array} originalCoords 原始坐标数组
 * @param {Array} transformedCoords 转换后坐标数组
 * @param {string} routeKey 路径键
 */
export function debugCoordinateTransform(originalCoords, transformedCoords, routeKey) {
  if (!Array.isArray(originalCoords) || !Array.isArray(transformedCoords)) {
    console.log(`❌ ${routeKey}: 坐标数据格式错误`);
    return;
  }
  
  console.log(`🔍 ${routeKey} 坐标转换对比:`);
  console.log(`- 原始坐标(GCJ-02) 前3个点:`, originalCoords.slice(0, 3));
  console.log(`- 转换坐标(WGS84) 前3个点:`, transformedCoords.slice(0, 3));
  
  if (originalCoords.length > 0 && transformedCoords.length > 0) {
    const originalFirst = originalCoords[0];
    const transformedFirst = transformedCoords[0];
    
    if (Array.isArray(originalFirst) && Array.isArray(transformedFirst)) {
      const deltaLng = transformedFirst[0] - originalFirst[0];
      const deltaLat = transformedFirst[1] - originalFirst[1];
      
      console.log(`- 坐标差值: 经度偏移 ${deltaLng.toFixed(6)}, 纬度偏移 ${deltaLat.toFixed(6)}`);
      console.log(`- 是否在中国境内: ${isInChina(originalFirst[0], originalFirst[1])}`);
    }
  }
} 