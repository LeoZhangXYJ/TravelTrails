import axios from 'axios';

const API_URL = 'http://localhost:8000';

// 创建专用的认证API实例
const authAxios = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

const authAPI = {
  async login(username, password) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await authAxios.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.data.access_token) {
        // 确保token是ASCII安全的
        const token = response.data.access_token;
        localStorage.setItem('token', token);
        localStorage.setItem('username', response.data.username);
        return response.data;
      }
      throw new Error('登录失败');
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        throw new Error(error.response.data.detail || '登录失败');
      }
      throw error;
    }
  },

  async register(userData) {
    try {
      const response = await authAxios.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      if (error.response) {
        throw new Error(error.response.data.detail || '注册失败');
      }
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUsername() {
    return localStorage.getItem('username');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

export { authAPI }; 