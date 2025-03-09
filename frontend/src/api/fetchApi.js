/**
 * 标准化API请求函数
 * 处理凭据、错误和认证
 */

const API_BASE_URL = 'http://localhost:8000';

/**
 * 发送API请求
 * @param {string} endpoint - API端点路径，如 '/api/auth/me'
 * @param {Object} options - 请求选项
 * @returns {Promise<any>} - 响应数据
 */
export async function fetchApi(endpoint, options = {}) {
  // 默认请求选项
  const defaultOptions = {
    credentials: 'include', // 默认包含凭据(cookies)
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const url = `${API_BASE_URL}${endpoint}`;
  const fetchOptions = { ...defaultOptions, ...options };

  try {
    console.log(`API请求: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, fetchOptions);
    
    // 调试响应信息
    console.log(`API响应: ${response.status} ${response.statusText}`);

    // 处理401未授权的特殊情况
    if (response.status === 401) {
      console.warn('认证失败，可能需要重新登录');
      // 清除本地存储的认证状态
      localStorage.removeItem('user');
      localStorage.setItem('authState', 'false');
      
      // 如果不是登录/注销相关端点，重定向到登录页面
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/logout')) {
        console.log('重定向到登录页面...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
      
      throw new Error('认证失败，请重新登录');
    }

    // 其他错误状态码
    if (!response.ok) {
      let errorDetail = 'API请求失败';
      
      try {
        // 尝试解析错误详情
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || '未知错误';
      } catch (e) {
        // JSON解析失败，使用状态文本
        errorDetail = response.statusText;
      }
      
      throw new Error(errorDetail);
    }

    // 检查是否有响应数据
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // 无JSON内容的成功响应
      return {
        success: true,
        status: response.status,
      };
    }
  } catch (error) {
    // 捕获所有错误，包括网络错误和上面抛出的错误
    console.error(`API错误 (${url}):`, error);
    throw error;
  }
}

// 常用请求方法
export const api = {
  get: (endpoint, options = {}) => fetchApi(endpoint, { method: 'GET', ...options }),
  post: (endpoint, data, options = {}) => fetchApi(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(data),
    ...options 
  }),
  put: (endpoint, data, options = {}) => fetchApi(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(data),
    ...options 
  }),
  delete: (endpoint, options = {}) => fetchApi(endpoint, { method: 'DELETE', ...options }),
};

export default api;
