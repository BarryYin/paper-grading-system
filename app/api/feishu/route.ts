import { NextResponse } from 'next/server';
import { FeishuService } from '@/lib/feishu';

const feishuService = new FeishuService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');

    if (recordId) {
      const result = await feishuService.getSubmissionResult(recordId);
      return NextResponse.json(result);
    } else {
      const history = await feishuService.getSubmissionHistory();
      return NextResponse.json(history);
    }
  } catch (error) {
    console.error('飞书 API 请求失败：', error);
    return NextResponse.json({ error: '请求失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    const recordId = await feishuService.submitPaper(content);
    return NextResponse.json({ recordId });
  } catch (error) {
    console.error('提交论文失败：', error);
    return NextResponse.json({ error: '提交失败' }, { status: 500 });
  }
}