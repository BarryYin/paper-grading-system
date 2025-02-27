import { NextResponse } from 'next/server';
import { FeishuService } from '@/lib/feishu';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    if (!content) {
      return NextResponse.json(
        { error: '论文内容不能为空' },
        { status: 400 }
      );
    }

    const feishuService = new FeishuService();
    const recordId = await feishuService.submitPaper(content);

    return NextResponse.json({
      data: {
        recordId,
      },
    });
  } catch (error) {
    console.error('提交论文失败:', error);
    return NextResponse.json(
      { error: '提交论文失败，请稍后重试' },
      { status: 500 }
    );
  }
}