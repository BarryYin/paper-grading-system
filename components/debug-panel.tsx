'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function DebugPanel() {
  const { user, isAuthenticated, loading, checkAuth, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{[key: string]: any}>({});

  const checkLocalStorage = () => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('auth_token');
    
    setDebugInfo({
      storedUser: storedUser ? JSON.parse(storedUser) : null,
      hasToken: !!storedToken,
      tokenPreview: storedToken ? `${storedToken.substring(0, 10)}...` : null
    });
  };

  const checkServerAuth = async () => {
    try {
      setDebugInfo({ checking: true });
      const response = await fetch('http://localhost:8000/api/auth/me', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        }
      });
      
      const data = await response.json();
      setDebugInfo({
        serverResponse: {
          status: response.status,
          success: response.ok,
          data
        }
      });
    } catch (error) {
      setDebugInfo({
        error: String(error)
      });
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    setDebugInfo({ cleared: true });
    setTimeout(() => window.location.reload(), 1000);
  };

  const refreshAuthState = async () => {
    setDebugInfo({ refreshing: true });
    const result = await checkAuth();
    setDebugInfo({ refreshComplete: true, authState: result });
  };

  if (!isOpen) {
    return (
      <button 
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded"
        onClick={() => setIsOpen(true)}
      >
        调试面板
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded shadow-lg p-4 w-96">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">认证调试面板</h3>
        <button onClick={() => setIsOpen(false)}>&times;</button>
      </div>
      
      <div className="mb-4">
        <div className="text-sm"><strong>当前状态:</strong> {loading ? '加载中' : isAuthenticated ? '已登录' : '未登录'}</div>
        {isAuthenticated && user && (
          <div className="text-sm mt-1">
            <strong>用户:</strong> {user.username} ({user.email})
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <button 
          className="bg-blue-500 text-white py-1 px-2 rounded text-xs"
          onClick={checkLocalStorage}
        >
          检查本地存储
        </button>
        
        <button 
          className="bg-green-500 text-white py-1 px-2 rounded text-xs ml-2"
          onClick={checkServerAuth}
        >
          检查服务器认证
        </button>
        
        <button 
          className="bg-yellow-500 text-white py-1 px-2 rounded text-xs ml-2"
          onClick={refreshAuthState}
        >
          刷新认证状态
        </button>
        
        <button 
          className="bg-red-500 text-white py-1 px-2 rounded text-xs ml-2"
          onClick={clearLocalStorage}
        >
          清除本地存储
        </button>
      </div>
      
      {Object.keys(debugInfo).length > 0 && (
        <div className="mt-4 text-xs bg-gray-100 p-2 rounded max-h-40 overflow-auto">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
