import React from 'react';
import { Navigate } from 'react-router-dom';

// 导入页面组件
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SubmissionsPage from './pages/SubmissionsPage';
import SubmissionDetailPage from './pages/SubmissionDetailPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * 路由配置
 * 
 * 包含公开路由和受保护路由
 * 受保护路由需要用户已登录
 */

// 公开路由 - 不需要认证
export const publicRoutes = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <Navigate to="/login" replace />,
  },
];

// 受保护路由 - 需要认证
export const protectedRoutes = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/submissions',
    element: <SubmissionsPage />,
  },
  {
    path: '/submissions/:id',
    element: <SubmissionDetailPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

// 注册专用路由函数，用于调试路由结构
export function registerRoutes() {
  console.log('已注册路由:');
  console.log('公开路由:', publicRoutes.map(r => r.path));
  console.log('受保护路由:', protectedRoutes.map(r => r.path));
  
  // 返回所有路由的平面列表，用于调试
  return [
    ...publicRoutes.map(route => ({ ...route, isPublic: true })),
    ...protectedRoutes.map(route => ({ ...route, isProtected: true })),
  ];
}
