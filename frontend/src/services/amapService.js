/**
 * 高德地图API服务
 * 用于获取真实路径轨迹
 */

// 使用后端API代理来避免跨域问题
const BACKEND_API_BASE = 'http://localhost:8000/amap';

/**
 * 获取两点之间的真实路径
 * @param {Object} startCoord 起始坐标 {lon, lat}
 * @param {Object} endCoord 结束坐标 {lon, lat}
 * @param {string} transportMode 交通方式 ('car', 'walk', 'bicycle', 'bus', 'train', 'plane', 'boat')
 * @returns {Promise<Array>} 路径坐标点数组
 */
export async function getRealRoute(startCoord, endCoord, transportMode) {
  try {
    const url = `${BACKEND_API_BASE}/route`;
    const params = new URLSearchParams({
      start_lon: startCoord.lon,
      start_lat: startCoord.lat,
      end_lon: endCoord.lon,
      end_lat: endCoord.lat,
      transport_mode: transportMode
    });

    const response = await fetch(`${url}?${params}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error('后端API返回失败');
    }
  } catch (error) {
    console.error('获取真实路径失败:', error);
    // 失败时返回直线路径
    return [
      [startCoord.lon, startCoord.lat],
      [endCoord.lon, endCoord.lat]
    ];
  }
}

// 所有具体的路径获取函数已移至后端处理

/**
 * 批量获取多个城市间的真实路径
 * @param {Array} cities 城市数组
 * @returns {Promise<Object>} 路径数据对象，key为城市索引组合，value为路径坐标
 */
export async function getBatchRealRoutes(cities) {
  try {
    const routeRequests = [];
    
    for (let i = 0; i < cities.length - 1; i++) {
      const currentCity = cities[i];
      const nextCity = cities[i + 1];
      
      if (currentCity.coordinates && nextCity.coordinates) {
        const routeRequest = {
          start_lon: currentCity.coordinates.lon,
          start_lat: currentCity.coordinates.lat,
          end_lon: nextCity.coordinates.lon,
          end_lat: nextCity.coordinates.lat,
          transport_mode: nextCity.transportMode || 'car'
        };
        console.log(`🚌 路径请求 ${i}: ${currentCity.name} -> ${nextCity.name}, 交通方式: ${routeRequest.transport_mode}`);
        routeRequests.push(routeRequest);
      }
    }
    
    if (routeRequests.length === 0) {
      return {};
    }

    const response = await fetch(`${BACKEND_API_BASE}/batch-routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        routes: routeRequests
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      // 转换索引格式为 "0-1", "1-2" 等
      const formattedRoutes = {};
      Object.keys(result.data).forEach(key => {
        const index = parseInt(key);
        const routeKey = `${index}-${index + 1}`;
        formattedRoutes[routeKey] = result.data[key];
      });
      return formattedRoutes;
    } else {
      throw new Error('批量获取路径失败');
    }
  } catch (error) {
    console.error('批量获取路径失败:', error);
    // 失败时返回空对象，将使用直线路径
    return {};
  }
} 