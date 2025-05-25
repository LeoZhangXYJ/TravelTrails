/**
 * 将角度转换为弧度
 * @param {number} degrees 角度
 * @returns {number} 弧度
 */
export const toRad = (degrees) => degrees * (Math.PI / 180);

/**
 * 计算两个地理坐标点之间的距离（使用Haversine公式）
 * @param {number} lat1 第一个点的纬度
 * @param {number} lon1 第一个点的经度
 * @param {number} lat2 第二个点的纬度
 * @param {number} lon2 第二个点的经度
 * @returns {number} 距离（公里）
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 地球半径（公里）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * 计算两个城市之间的距离
 * @param {Object} city1 第一个城市对象，包含coordinates属性
 * @param {Object} city2 第二个城市对象，包含coordinates属性
 * @returns {number} 距离（公里）
 */
export const calculateDistanceBetweenCities = (city1, city2) => {
  if (!city1 || !city2 || !city1.coordinates || !city2.coordinates) return 0;
  return calculateDistance(
    city1.coordinates.lat,
    city1.coordinates.lon,
    city2.coordinates.lat,
    city2.coordinates.lon
  );
};

/**
 * 验证经纬度坐标是否有效
 * @param {number} lat 纬度
 * @param {number} lon 经度
 * @returns {boolean} 是否有效
 */
export const isValidCoordinates = (lat, lon) => {
  return (
    typeof lat === 'number' && 
    typeof lon === 'number' &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  );
}; 