import { NextResponse } from 'next/server';
import { FeishuService } from '@/lib/feishu';

export async function POST(request: Request) {
  try {
    // 解析请求数据
    const paperData = await request.json();
    
    // 验证请求数据
    if (!paperData || !paperData.title || !paperData.content) {
      return NextResponse.json(
        { error: "请求数据不完整，请确保提供论文标题和内容" },
        { status: 400 }
      );
    }
    
    // 初始化飞书服务
    const feishuService = new FeishuService();
    
    console.log("正在提交论文:", { 
      title: paperData.title,
      hasAttachments: !!(paperData.attachments && paperData.attachments.length)
    });
    
    // 提交论文
    try {
      const result = await feishuService.submitPaper(paperData);
      
      // 返回成功响应
      return NextResponse.json({
        success: true,
        message: "论文提交成功",
        data: result
      });
    } catch (error) {
      // 处理飞书服务错误
      console.error("提交论文到飞书服务失败:", error);
      return NextResponse.json(
        { 
          error: "提交论文失败", 
          message: error instanceof Error ? error.message : "未知错误",
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // 处理其他错误
    console.error("处理论文提交请求时发生错误:", error);
    return NextResponse.json(
      { error: "处理请求失败", message: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const feishuService = new FeishuService();
    const submissions = await feishuService.getSubmissionHistory();
    
    return NextResponse.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error("获取提交历史失败:", error);
    return NextResponse.json(
      { error: "获取提交历史失败", message: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}