import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加token到请求头
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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