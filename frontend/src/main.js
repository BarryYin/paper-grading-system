// 导入您应用的其他依赖...
import { initAuth } from './utils/auth';

// 在应用启动前初始化认证状态
initAuth().then(authState => {
  console.log('初始认证状态:', authState);
  
  // 这里是您的应用初始化代码
  // 例如 createApp、ReactDOM.render 等
  
  // 如果用户未认证且当前不在登录页面，重定向到登录页面
  if (!authState.isAuthenticated && 
      !window.location.pathname.includes('/login') && 
      !window.location.pathname.includes('/register')) {
    window.location.href = '/login';
  }
});

// 添加页面刷新前的监听器，确保获取最新认证状态
window.addEventListener('beforeunload', () => {
  // 在页面刷新前不保存过时的认证状态
  sessionStorage.removeItem('lastAuthCheck');
});
