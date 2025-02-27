// 服务器端安全地处理飞书API认证
import { Readable } from 'stream';

export class FeishuService {
  private appId: string;
  private appSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  
  constructor() {
    // 从环境变量获取飞书应用凭据
    this.appId = process.env.FEISHU_APP_ID || '';
    this.appSecret = process.env.FEISHU_APP_SECRET || '';
    
    if (!this.appId || !this.appSecret) {
      console.error('飞书应用ID或密钥未配置');
    }
  }
  
  async authenticate() {
    try {
      const now = Date.now();
      
      // 如果token仍然有效，直接返回
      if (this.accessToken && this.tokenExpiresAt > now) {
        return this.accessToken;
      }
      
      const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret
        })
      });
      
      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`飞书API认证失败: ${data.msg}`);
      }
      
      this.accessToken = data.tenant_access_token;
      // token有效期通常为2小时，这里设置为1小时50分钟后过期
      this.tokenExpiresAt = now + (data.expire * 1000) - 600000;
      
      return this.accessToken;
    } catch (error) {
      console.error('飞书API认证失败:', error);
      throw new Error('飞书API认证失败');
    }
  }
  
  async uploadFile(file: File) {
    try {
      const token = await this.authenticate();
      
      // 准备表单数据
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_name', file.name);
      formData.append('parent_type', 'bitable_file');
      formData.append('parent_node', process.env.FEISHU_BITABLE_ID || '');
      
      const response = await fetch('https://open.feishu.cn/open-apis/drive/v1/files/upload_all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(`文件上传失败: ${result.msg}`);
      }
      
      return {
        url: result.data.file_token,
        name: file.name,
        type: file.type
      };
    } catch (error) {
      console.error('文件上传过程中发生错误:', error);
      throw error;
    }
  }
}
