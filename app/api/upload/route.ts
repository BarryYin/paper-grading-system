import { NextRequest, NextResponse } from 'next/server';
import { FeishuService } from '@/lib/server/feishu';

// 文件上传的最大大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // 检查请求格式
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: "请求格式错误，需要multipart/form-data格式" },
        { status: 400 }
      );
    }

    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // 验证文件
    if (!file) {
      return NextResponse.json(
        { error: "未找到文件" },
        { status: 400 }
      );
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件大小超过限制，最大允许${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 413 }
      );
    }
    
    // 检查文件类型
    const allowedTypes = [
      'application/pdf', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "不支持的文件类型，仅支持PDF、Word和文本文件" },
        { status: 415 }
      );
    }
    
    // 使用飞书服务上传文件
    const feishuService = new FeishuService();
    const result = await feishuService.uploadFile(file);
    
    // 返回上传结果
    return NextResponse.json({
      success: true,
      message: "文件上传成功",
      data: {
        name: file.name,
        url: result.url,
        type: file.type,
        file_token: result.file_token
      }
    });
  } catch (error) {
    console.error("文件上传处理失败:", error);
    return NextResponse.json(
      { 
        error: "文件上传失败", 
        message: error instanceof Error ? error.message : "未知错误" 
      },
      { status: 500 }
    );
  }
}
