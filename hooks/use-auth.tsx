'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface User {
  user_id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, email: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 从本地存储加载用户信息并自动验证会话状态
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        console.log("页面加载时恢复认证状态...");
        
        // 首先从localStorage获取用户信息
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('auth_token');
        
        if (storedUser) {
          console.log("从localStorage恢复用户信息");
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
        
        // 无论是否从localStorage中恢复了状态，都尝试检查服务器认证状态
        // 这样可以同步服务器和客户端的状态
        await checkAuth();
      } catch (error) {
        console.error('验证会话状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
    
    // 添加页面可见性变化监听，当用户切换回页面时重新验证会话
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await checkAuth();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 每30分钟自动检查一次认证状态
    const intervalId = setInterval(() => {
      checkAuth().catch(console.error);
    }, 30 * 60 * 1000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);


  // 检查用户认证状态
  const checkAuth = async (): Promise<boolean> => {
    try {
      console.log("检查认证状态...");
      const response = await fetch('http://localhost:8000/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        credentials: 'include', // 包含cookie
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.user) {
          console.log("服务器确认用户已登录", data.user);
          setUser(data.user);
          setIsAuthenticated(true);
          // 更新本地存储
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // 保存新token如果有
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
          }
          
          return true;
        } else {
          console.log("服务器返回数据无效", data);
          // 不立即清除状态，保持本地状态
          return isAuthenticated;
        }
      } else if (response.status === 401) {
        console.log("服务器拒绝认证");
        // 认证失败，清除状态
        clearAuthState();
        return false;
      } else {
        console.log("服务器返回错误", response.status);
        // 其他错误，保持当前状态
        return isAuthenticated;
      }
    } catch (error) {
      console.error('验证用户状态失败:', error);
      // 网络错误，不清除状态
      return isAuthenticated;
    }
  };

  // 清除认证状态
  const clearAuthState = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('user');
  };

  // 修改登录函数，增加调试登录选项
  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log(`尝试登录，用户名: ${username}`);
      
      // 首先尝试常规登录流程
      let success = await attemptRegularLogin(username, password);
      
      // 如果失败，尝试调试登录
      if (!success) {
        console.log("常规登录失败，尝试调试登录");
        success = await attemptDebugLogin(username, password);
      }
      
      return success;
    } catch (error) {
      console.error('所有登录尝试都失败:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 常规登录流程
  const attemptRegularLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      // 使用FormData提交
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      console.log("登录响应状态:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("登录成功:", data);
        
        setIsAuthenticated(true);
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        
        // 登录成功后刷新页面
        window.location.reload();
        return true;
      }
      
      // 尝试使用JSON格式
      return await loginWithJson(username, password);
    } catch (error) {
      console.error('常规登录失败:', error);
      return false;
    }
  };
  
  // 调试登录流程
  const attemptDebugLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/debug-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.log("调试登录失败:", response.status);
        return false;
      }
      
      const data = await response.json();
      console.log("调试登录成功:", data);
      
      setIsAuthenticated(true);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      // 登录成功后刷新页面
      window.location.reload();
      return true;
    } catch (error) {
      console.error('调试登录失败:', error);
      return false;
    }
  };

  // 使用JSON格式登录的备用方法
  const loginWithJson = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/login/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('JSON格式登录失败:', error);
      return false;
    }
  };

  // 注册
  const register = async (username: string, password: string, email: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
        credentials: 'include',
      });
      
      return response.ok;
    } catch (error) {
      console.error('注册失败:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const logout = async (): Promise<boolean> => {
    try {
      await fetch('http://localhost:8000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
      
      // 不管API响应如何，都清除本地状态
      clearAuthState();
      
      // 登出后刷新页面
      window.location.reload();
      return true;
    } catch (error) {
      console.error('登出失败:', error);
      // 即使请求失败也清除本地状态
      clearAuthState();
      
      // 登出后刷新页面
      window.location.reload();
      return true;
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};