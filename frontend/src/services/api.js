import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加token到请求头
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // 现在token应该已经是ASCII安全的
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API response error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 旅行相关API - 对应后端实际API结构
export const travelAPI = {
  getCities: (username) => api.get(`/travel/${username}/cities`),
  addCity: (username, cityData) => api.post(`/travel/${username}/cities`, cityData),
  updateCityBlog: (username, cityIndex, blogData) => api.put(`/travel/${username}/cities/${cityIndex}/blog`, blogData),
  deleteCity: (username, cityIndex) => api.delete(`/travel/${username}/cities/${cityIndex}`),
  addPhoto: (username, cityIndex, photoData) => {
    const formData = new FormData();
    formData.append('photo', photoData);
    return api.post(`/travel/${username}/cities/${cityIndex}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deletePhoto: (username, cityIndex, photoIndex) => api.delete(`/travel/${username}/cities/${cityIndex}/photos/${photoIndex}`),
  getAIRecommendations: (visitedCities) => api.post('/travel/ai/recommendations', { visitedCities }),
};

// 用户相关API
export const userAPI = {
  getProfile: (username) => api.get(`/users/me?username=${username}`),
  updateProfile: (username, userData) => api.put(`/users/me?username=${username}`, userData),
  deleteAccount: (username) => api.delete(`/users/me?username=${username}`),
};

// 认证相关API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
  },
};

// 城市相关API
export const cityAPI = {
  getCities: () => api.get('/cities'),
  addCity: (cityData) => api.post('/cities', cityData),
  updateCity: (id, cityData) => api.put(`/cities/${id}`, cityData),
  deleteCity: (id) => api.delete(`/cities/${id}`),
};

// 照片相关API
export const photoAPI = {
  getPhotos: (cityId) => api.get(`/photos/${cityId}`),
  uploadPhoto: (cityId, photoData) => api.post(`/photos/${cityId}`, photoData),
  deletePhoto: (photoId) => api.delete(`/photos/${photoId}`),
};

// 博客相关API
export const blogAPI = {
  getBlog: (cityId) => api.get(`/blogs/${cityId}`),
  updateBlog: (cityId, content) => api.put(`/blogs/${cityId}`, { content }),
};

// 统计相关API
export const statsAPI = {
  getStats: () => api.get('/stats'),
};

export default api; 