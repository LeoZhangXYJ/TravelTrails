import axios from 'axios';

const API_URL = 'http://localhost:8000';

const authAPI = {
  async login(username, password) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post(`${API_URL}/auth/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        return response.data;
      }
      throw new Error('登录失败');
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.detail || '登录失败');
      }
      throw error;
    }
  },

  async register(userData) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.detail || '注册失败');
      }
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('token');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

// 添加请求拦截器
axios.interceptors.request.use(
  (config) => {
    const token = authAPI.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      authAPI.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { authAPI }; 