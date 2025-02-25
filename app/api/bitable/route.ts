import { NextResponse } from 'next/server';
import { FeishuService } from '@/lib/feishu';

const feishuService = new FeishuService({
  appId: process.env.FEISHU_APP_ID || '',
  appSecret: process.env.FEISHU_APP_SECRET || '',
  tableId: process.env.FEISHU_TABLE_ID || '',
  viewId: process.env.FEISHU_VIEW_ID || ''
});

export async function GET() {
  try {
    const submissions = await feishuService.getSubmissionHistory();
    return NextResponse.json({ data: submissions });
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    return NextResponse.json(
      { error: '获取提交历史失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    if (!content) {
      return NextResponse.json(
        { error: '内容不能为空' },
        { status: 400 }
      );
    }

    const recordId = await feishuService.submitPaper(content);
    return NextResponse.json({ data: { recordId } });
  } catch (error) {
    console.error('Failed to submit paper:', error);
    return NextResponse.json(
      { error: '提交论文失败' },
      { status: 500 }
    );
  }
}