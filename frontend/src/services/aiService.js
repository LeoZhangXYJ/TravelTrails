import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const getRecommendations = async (visitedCities) => {
  try {
    // 确保数据格式正确
    const requestData = {
      visitedCities: visitedCities.map(city => ({
        city: city.city || city.name,  // 支持两种格式：直接city字段或前端的name字段
        country: city.country || '未知'
      }))
    };

    console.log('Sending request data:', JSON.stringify(requestData, null, 2));

    const response = await axios.post(`${API_URL}/ai/recommendations`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('获取推荐失败，请稍后重试');
  }
}; 