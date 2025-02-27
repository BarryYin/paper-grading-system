import { feishuConfig } from './feishu.config';

interface PaperSubmission {
  id: string
  论文标题: string
  文档核心内容: string
  论文目录?: string
  论文研究方法修改意见?: string
  论文研究方法得分?: string
  论文结构修改意见?: string
  论文结构得分?: string
  论文结论?: string
  论文论证逻辑修改意见?: string
  论文论证逻辑得分?: string
  论文采用论证方法?: string
  附件上传?: {
    name: string
    url: string
    type: string
  }[]
  附件内容摘要?: string
}

interface FileUploadResult {
  file_token?: string;
  url: string;
  ticket?: string;
}

export class FeishuService {
  private baseUrl: string
  private accessToken: string
  private tokenExpiry: number
  private appId: string
  private appSecret: string
  
  // 飞书多维表格应用和表格ID
  private appId_bitable: string
  private tableId: string

  constructor() {
    // 使用配置文件中的值
    this.baseUrl = feishuConfig.baseUrl || 'https://open.feishu.cn/open-apis';
    this.appId = feishuConfig.appId || '';
    this.appSecret = feishuConfig.appSecret || '';
    
    // 从环境变量获取多维表格ID
    this.appId_bitable = process.env.FEISHU_BITABLE_APP_ID || 'EizAbvZvxaTrKlsiumGcXLBuneb';
    this.tableId = process.env.FEISHU_TABLE_ID || 'tblIlSF9KydXg612';
    
    this.accessToken = '';
    this.tokenExpiry = 0;
  }

  // 上传文件方法
  async uploadFile(file: File): Promise<FileUploadResult> {
    try {
      // 确保已认证
      if (!this.isAuthenticated()) {
        await this.authenticate();
      }

      console.log("开始上传文件", { fileName: file.name, fileSize: file.size });
      
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_name', file.name);
      formData.append('parent_type', 'bitable_file'); 
      formData.append('parent_node', this.appId_bitable);
      
      // 发送到飞书文件上传API
      const response = await fetch(`${this.baseUrl}/drive/v1/files/upload_all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          // 不要设置Content-Type，因为fetch会自动设置multipart/form-data和边界
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("文件上传请求失败:", {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`文件上传失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("文件上传成功", { fileData: data });
      
      // 返回包含URL的对象
      return {
        file_token: data.data?.file_token,
        url: data.data?.url || `https://open.feishu.cn/open-apis/drive/v1/files/${data.data?.file_token}/download`,
        ticket: data.data?.ticket
      };
    } catch (error) {
      console.error("文件上传过程中发生错误:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }
      throw new Error("Failed to upload file: Unknown error");
    }
  }

  async submitPaper(paperData: any): Promise<any> {
    try {
      // 确保已认证
      if (!this.isAuthenticated()) {
        await this.authenticate();
      }
      
      console.log("开始提交论文到飞书", paperData);
      
      // 根据飞书多维表格API格式化请求
      const fields: Record<string, any> = {
        "论文标题": paperData.title,
        "文档核心内容": paperData.content
      };
      
      // 如果存在附件，添加附件字段
      if (paperData.attachments && paperData.attachments.length > 0) {
        fields["附件上传"] = paperData.attachments.map((attachment: any) => ({
          "text": attachment.name,
          "link": attachment.url
        }));
        
        if (paperData.attachmentSummary) {
          fields["附件内容摘要"] = paperData.attachmentSummary;
        }
      }
      
      // 添加其他可选字段
      if (paperData.outline) fields["论文目录"] = paperData.outline;
      if (paperData.methodology) fields["论文采用论证方法"] = paperData.methodology;
      
      const payload = {
        fields: fields
      };
      
      // 发送请求到飞书多维表格API
      const response = await fetch(`${this.baseUrl}/bitable/v1/apps/${this.appId_bitable}/tables/${this.tableId}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("飞书多维表格API请求失败:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestPayload: payload
        });
        throw new Error(`飞书API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("论文提交成功", { responseData: data });
      return data.data;
    } catch (error) {
      console.error("提交论文过程中发生错误:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to submit paper: ${error.message}`);
      }
      throw new Error("Failed to submit paper: Unknown error");
    }
  }
  
  // 验证认证状态
  private isAuthenticated(): boolean {
    return !!this.accessToken && this.tokenExpiry > Date.now();
  }
  
  // 认证方法
  private async authenticate(): Promise<void> {
    try {
      // 实现飞书API认证 - 使用tenant_access_token方式
      const response = await fetch(`${this.baseUrl}/auth/v3/tenant_access_token/internal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret
        })
      });
      
      if (!response.ok) {
        throw new Error(`认证请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`认证失败: ${data.msg}`);
      }
      
      this.accessToken = data.tenant_access_token;
      // 设置过期时间
      this.tokenExpiry = Date.now() + (data.expire * 1000);
      console.log("飞书API认证成功，令牌将在", new Date(this.tokenExpiry).toLocaleString(), "过期");
    } catch (error) {
      console.error("飞书认证失败:", error);
      throw new Error("Failed to authenticate with Feishu API");
    }
  }

  async getSubmissionResult(recordId: string): Promise<PaperSubmission | null> {
    try {
      // 确保已认证
      if (!this.isAuthenticated()) {
        await this.authenticate();
      }
      
      const response = await fetch(`${this.baseUrl}/bitable/v1/apps/${this.appId_bitable}/tables/${this.tableId}/records/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`获取提交记录失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data as PaperSubmission;
    } catch (error) {
      console.error("获取提交结果失败:", error);
      throw new Error('Failed to get submission result');
    }
  }

  async getSubmissionHistory(): Promise<PaperSubmission[]> {
    try {
      // 确保已认证
      if (!this.isAuthenticated()) {
        await this.authenticate();
      }
      
      const response = await fetch(`${this.baseUrl}/bitable/v1/apps/${this.appId_bitable}/tables/${this.tableId}/records?page_size=20`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`获取提交历史失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.data.items.map((item: any) => item.fields);
    } catch (error) {
      console.error("获取提交历史失败:", error);
      throw new Error('Failed to get submission history');
    }
  }
}