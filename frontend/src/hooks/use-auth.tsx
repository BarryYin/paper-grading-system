import { useState, useEffect, useCallback } from 'react';

// 定义认证状态接口
interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  error: string | null;
}

// 定义登录参数接口
interface LoginParams {
  username: string;
  password: string;
}

// 认证钩子
export function useAuth() {
  // 初始状态
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  // 检查认证状态
  const checkAuth = useCallback(async () => {
    try {
      console.log('检查用户认证状态...');
      
      const response = await fetch('http://localhost:8000/api/auth/me', {
        method: 'GET',
        credentials: 'include', // 确保发送cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('认证检查响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('用户已认证:', data.user);
        
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          loading: false,
          error: null,
        });
        
        // 更新localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('authState', 'true');
      } else {
        console.log('用户未认证 (HTTP状态码: ' + response.status + ')');
        // 清除任何过时的认证数据
        localStorage.removeItem('user');
        localStorage.setItem('authState', 'false');
        
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('验证用户状态失败:', error);
      
      // 处理网络错误时，检查本地存储
      const storedAuthState = localStorage.getItem('authState');
      const storedUser = localStorage.getItem('user');
      
      if (storedAuthState === 'true' && storedUser) {
        // 如果本地存储表明用户已登录，保持登录状态
        console.log('使用本地存储的认证状态 (因为网络请求失败)');
        setAuthState({
          isAuthenticated: true,
          user: JSON.parse(storedUser),
          loading: false,
          error: null,
        });
      } else {
        // 默认为未登录状态
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: '检查认证状态失败',
        });
      }
    }
  }, []);

  // 页面可见性变化时检查认证状态
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };

    // 添加页面可见性变化事件监听
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 初始加载时检查
    checkAuth();

    // 清理
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuth]);

  // 登录函数
  const login = async (credentials: LoginParams) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('尝试登录...');
      const response = await fetch('http://localhost:8000/api/auth/login/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include', // 确保接收和存储cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '登录失败');
      }

      const data = await response.json();
      console.log('登录成功:', data);
      
      // 更新认证状态
      setAuthState({
        isAuthenticated: true,
        user: data.user,
        loading: false,
        error: null,
      });
      
      // 保存到本地存储
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('authState', 'true');
      
      return data;
    } catch (error) {
      console.error('登录失败:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : '登录失败',
      });
      throw error;
    }
  };

  // 登出函数
  const logout = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      console.log('尝试登出...');
      const response = await fetch('http://localhost:8000/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // 确保发送cookies
      });

      // 无论服务器响应如何，都清除本地认证状态
      localStorage.removeItem('user');
      localStorage.setItem('authState', 'false');
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
      
      console.log('登出成功');
      return response.ok;
    } catch (error) {
      console.error('登出失败:', error);
      
      // 即使API调用失败，也清除本地状态
      localStorage.removeItem('user');
      localStorage.setItem('authState', 'false');
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : '登出失败',
      });
      
      // 强制刷新页面，确保状态完全重置
      window.location.href = '/login';
      throw error;
    }
  };

  // 返回认证状态和函数
  return {
    ...authState,
    login,
    logout,
    checkAuth,
  };
}

export default useAuth;
