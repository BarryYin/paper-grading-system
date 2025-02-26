import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { uploadToBitable } from '../lib/feishu';

describe('飞书多维表格上传测试', () => {
  const testFilePath = path.join(__dirname, 'test.txt');
  const testContent = '这是一个测试文档内容';

  beforeAll(() => {
    // 创建测试文件
    fs.writeFileSync(testFilePath, testContent);
  });

  afterAll(() => {
    // 清理测试文件
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('应该能够成功上传文件内容到多维表格', async () => {
    const fileContent = fs.readFileSync(testFilePath, 'utf-8');
    
    try {
      const response = await uploadToBitable({
        content: fileContent,
        fileName: 'test.txt'
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.recordId).toBeDefined();
    } catch (error) {
      console.error('上传测试失败:', error);
      throw error;
    }
  });

  it('应该能够处理空文件内容', async () => {
    try {
      const response = await uploadToBitable({
        content: '',
        fileName: 'empty.txt'
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
    } catch (error) {
      console.error('空文件测试失败:', error);
      throw error;
    }
  });

  it('应该能够处理特殊字符', async () => {
    const specialContent = '特殊字符测试：!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    try {
      const response = await uploadToBitable({
        content: specialContent,
        fileName: 'special.txt'
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
    } catch (error) {
      console.error('特殊字符测试失败:', error);
      throw error;
    }
  });
});