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
        // 首先尝试验证会话状态
        const authValid = await checkAuth();
        
        if (authValid) {
          // 如果会话有效，使用服务器返回的用户信息
          return;
        }
        
        // 如果会话无效，尝试从本地存储恢复
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          // 尝试使用本地存储的信息重新建立会话
          await checkAuth();
        }
      } catch (error) {
        console.error('验证会话状态失败:', error);
        clearAuthState();
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
    
    // 添加页面刷新前的事件监听，确保会话状态保存
    const handleBeforeUnload = () => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);


  // 检查用户认证状态
  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setUser(data);
          // 更新本地存储
          localStorage.setItem('user', JSON.stringify(data));
          setIsAuthenticated(true);
          return true;
        } else {
          clearAuthState();
          return false;
        }
      } else {
        clearAuthState();
        return false;
      }
    } catch (error) {
      console.error('验证用户状态失败:', error);
      clearAuthState();
      return false;
    }
  };

  // 清除认证状态
  const clearAuthState = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('user');
  };

  // 登录
  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsAuthenticated(true);
        setUser(data.user);
        // 保存到本地存储
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    } finally {
      setLoading(false);
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
      const response = await fetch('http://localhost:8000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        clearAuthState();
        return true;
      }
      return false;
    } catch (error) {
      console.error('登出失败:', error);
      return false;
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