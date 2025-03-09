import axios from 'axios';

const API_URL = '/api'; // 根据实际API地址调整

// 设置axios默认携带凭据
axios.defaults.withCredentials = true;

// 认证服务
const authService = {
  // 登录方法
  async login(username, password) {
    try {
      const response = await axios.post(`${API_URL}/login/json`, { username, password });
      
      // 存储用户信息
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('authState', 'true');
      }
      
      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },
  
  // 登出方法
  async logout() {
    try {
      const response = await axios.post(`${API_URL}/logout`);
      
      // 彻底清除所有本地存储
      localStorage.removeItem('user');
      localStorage.removeItem('authState');
      localStorage.removeItem('token');
      sessionStorage.clear();
      
      // 清除所有可能存在的认证相关cookie
      document.cookie.split(';').forEach(c => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      // 为确保彻底清除，强制刷新页面
      if (response.data.clearStorage) {
        setTimeout(() => {
          window.location.href = response.data.redirect || '/login';
        }, 100);
      }
      
      return response.data;
    } catch (error) {
      console.error('登出失败:', error);
      // 即使API调用失败，也清除本地存储
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
      throw error;
    }
  },
  
  // 获取当前用户
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
  
  // 检查认证状态
  async checkAuthState() {
    try {
      // 尝试获取当前用户信息
      const response = await axios.get(`${API_URL}/me`);
      localStorage.setItem('authState', 'true');
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { 
        refreshComplete: true, 
        authState: true 
      };
    } catch (error) {
      // 如果获取失败，清除认证状态
      localStorage.removeItem('user');
      localStorage.setItem('authState', 'false');
      return {
        refreshComplete: true,
        authState: false
      };
    }
  }
};

export default authService;
