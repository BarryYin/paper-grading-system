import { NextResponse } from 'next/server';
import { FeishuService } from '@/lib/feishu';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const feishuService = new FeishuService();
    const submission = await feishuService.getSubmissionById(params.id);
    
    if (!submission) {
      return NextResponse.json(
        { error: "未找到论文" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(submission);
  } catch (error) {
    console.error("获取论文详情失败:", error);
    return NextResponse.json(
      { error: "获取论文详情失败", message: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}