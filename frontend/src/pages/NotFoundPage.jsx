import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NotFoundPage = () => {
  const location = useLocation();

  return (
    <div className="not-found-page">
      <h1>页面未找到</h1>
      <p>抱歉，您请求的页面 <code>{location.pathname}</code> 不存在。</p>
      
      <div className="actions">
        <Link to="/" className="home-link">返回首页</Link>
        <Link to="/submissions" className="submissions-link">查看论文列表</Link>
      </div>
      
      <div className="help-info">
        <h3>可能的原因：</h3>
        <ul>
          <li>URL拼写错误</li>
          <li>该资源已被删除</li>
          <li>您没有访问该资源的权限</li>
        </ul>
        
        <h3>常见论文ID格式：</h3>
        <ul>
          <li>receDrtyx8</li>
          <li>recuEG6Z8QuOWy</li>
          <li>recPFmvHG1</li>
        </ul>
        
        <p>正确的URL格式应为：<code>/submissions/rec开头的ID</code></p>
      </div>
    </div>
  );
};

export default NotFoundPage;
