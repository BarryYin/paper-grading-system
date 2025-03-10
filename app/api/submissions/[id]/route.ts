import { NextResponse } from 'next/server';

const BACKEND_API_URL = 'http://localhost:8000/api/submissions';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${BACKEND_API_URL}/${params.id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('获取论文详情失败:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      return NextResponse.json(
        {
          error: '获取论文详情失败',
          message: `后端API返回错误: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const submission = await response.json();
    return NextResponse.json(submission);
  } catch (error) {
    console.error('获取论文详情失败:', error);
    return NextResponse.json(
      {
        error: '获取论文详情失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
