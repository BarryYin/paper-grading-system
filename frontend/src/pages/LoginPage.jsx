import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useTestAccount, setUseTestAccount] = useState(false);

  // 检查是否已登录
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleTestAccountToggle = () => {
    setUseTestAccount(prev => !prev);
    if (!useTestAccount) {
      // 如果正在切换到使用测试账户，清空输入字段
      setCredentials({ username: '', password: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const loginData = useTestAccount 
        ? { use_test_account: true } 
        : credentials;
      
      // 使用调试登录端点
      const response = await fetch('/api/debug-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '登录失败');
      }
      
      const data = await response.json();
      
      // 存储用户信息
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('authState', 'true');
      
      // 重定向到主页
      navigate('/');
      
    } catch (error) {
      console.error('登录错误:', error);
      setError(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>用户登录</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={useTestAccount}
              onChange={handleTestAccountToggle}
            />
            使用测试账户登录
          </label>
        </div>

        {!useTestAccount && (
          <>
            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading ? '登录中...' : (useTestAccount ? '使用测试账户登录' : '登录')}
        </button>
      </form>
      
      <div className="login-help">
        <p>注意: 用户名和密码必须在users.csv文件中存在才能登录成功。</p>
        {useTestAccount && <p>当前使用测试账户登录 (test/test)</p>}
      </div>
    </div>
  );
};

export default LoginPage;
