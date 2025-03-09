import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import authService from './services/auth';
import { publicRoutes, protectedRoutes, registerRoutes } from './routes';
import Header from './components/Header';
import Footer from './components/Footer';

// 调试用 - 注册并显示路由信息
registerRoutes();

// 受保护的路由组件
const ProtectedRoutes = () => {
  return (
    <>
      <Header />
      <main className="main-content">
        <Routes>
          {protectedRoutes.map((route) => (
            <Route 
              key={route.path} 
              path={route.path} 
              element={route.element} 
            />
          ))}
        </Routes>
      </main>
      <Footer />
    </>
  );
};

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 在组件加载时检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('检查认证状态...');
        const { authState } = await authService.checkAuthState();
        console.log('认证状态:', authState);
        setIsAuthenticated(authState);
      } catch (error) {
        console.error('认证状态检查失败:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // 显示加载中
  if (loading) {
    return <div className="loading-screen">加载中...</div>;
  }
  
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        {publicRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={!isAuthenticated ? route.element : <Navigate to="/" />}
          />
        ))}
        
        {/* 需要认证的路由 */}
        <Route 
          path="/*" 
          element={isAuthenticated ? <ProtectedRoutes /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
