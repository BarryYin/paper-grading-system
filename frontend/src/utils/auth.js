// 检查认证状态
async function checkAuthStatus() {
  // 首先检查本地存储的认证状态是否存在
  const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  // 如果本地没有存储用户信息，说明未登录
  if (!storedUser) {
    return { isAuthenticated: false, user: null };
  }
  
  try {
    // 尝试向服务器验证当前认证状态
    const response = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include', // 确保包含cookies
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    // 如果响应码不是2xx，表示认证无效
    if (!response.ok) {
      console.log('认证过期或无效');
      // 清除所有本地存储
      clearAuthState();
      return { isAuthenticated: false, user: null };
    }
    
    // 解析响应数据
    const data = await response.json();
    // 更新本地存储
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return { isAuthenticated: true, user: data.user };
  } catch (error) {
    console.error('验证认证状态时出错:', error);
    // 发生错误时，清除本地认证状态
    clearAuthState();
    return { isAuthenticated: false, user: null };
  }
}

// 清除所有认证状态的辅助函数
function clearAuthState() {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  
  // 清除任何可能存在的authState全局变量
  if (window.authState) {
    window.authState.isAuthenticated = false;
    window.authState.user = null;
  }
  
  // 清除任何可能在Redux或其他状态管理中的状态
  if (window.store && typeof window.store.dispatch === 'function') {
    try {
      window.store.dispatch({ type: 'LOGOUT' });
    } catch (e) {
      console.error('无法分发LOGOUT动作:', e);
    }
  }
  
  // 清除所有相关的cookies
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.split('=').map(c => c.trim());
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
  });
}

// 增强版的登出函数
async function logout() {
  try {
    // 调用后端登出API
    const response = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',  // 确保包含cookies
    });
    
    // 不管API调用是否成功，都清除本地状态
    clearAuthState();
    
    try {
      // 获取响应JSON
      const data = await response.json();
      
      // 如果需要重定向
      if (data.status === 'redirect') {
        window.location.href = data.url;
        return true;
      }
    } catch (e) {
      console.error('解析登出响应失败:', e);
    }
    
    // 默认重定向到登录页面
    window.location.href = '/login';
    return true;
  } catch (error) {
    console.error('登出错误:', error);
    // 如果API调用失败，仍然清除本地状态并重定向
    clearAuthState();
    window.location.href = '/login';
    return false;
  }
}

// 初始化函数，在应用启动时调用
function initAuth() {
  // 立即检查认证状态
  return checkAuthStatus().then(state => {
    // 存储全局认证状态
    window.authState = state;
    return state;
  });
}

export { logout, checkAuthStatus, clearAuthState, initAuth };
