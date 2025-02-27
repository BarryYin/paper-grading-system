export const feishuConfig = {
  baseUrl: process.env.FEISHU_API_BASE_URL || 'https://open.feishu.cn/open-apis',
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  // 重试设置
  maxRetries: 3,
  retryDelay: 1000,
  // 超时设置
  timeout: 30000,
};

// 验证配置是否完整
export function validateFeishuConfig() {
  const requiredEnvVars = ['FEISHU_APP_ID', 'FEISHU_APP_SECRET'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`警告: 飞书API配置不完整, 缺少以下环境变量: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}
