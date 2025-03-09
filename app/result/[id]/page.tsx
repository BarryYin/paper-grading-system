'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Submission {
  id: string;
  论文标题?: string;
  文档核心内容?: string;
  附件上传?: Array<{ name: string; url: string }>;
  论文研究方法得分?: string;
  论文研究方法完整分析?: string;
  论文结构得分?: string;
  论文结构完整分析?: string;
  论文论证逻辑得分?: string;
  论文论证逻辑完整分析?: string;
}

export default function PaperResult({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/submissions/${params.id}`, {
          credentials: 'include', // 添加credentials选项，确保发送cookie
        });
        if (!response.ok) {
          throw new Error('获取论文详情失败');
        }
        const data = await response.json();
        setCurrentSubmission(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [params.id]);

  if (loading) {
    return <div className="container mx-auto py-8">加载中...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8 text-red-500">{error}</div>;
  }

  if (!currentSubmission) {
    return <div className="container mx-auto py-8">未找到论文</div>;
  }

  return (
    <div className="container mx-auto py-8">
      {/* 返回按钮 */}
      <button 
        onClick={() => router.back()}
        className="mb-4 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        返回上一页
      </button>
      
      <div className="grid grid-cols-2 gap-8">
        {/* 左侧：论文内容和附件 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{currentSubmission.论文标题 || '无标题'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap mb-4">
                {/* 文档核心内容 */}
                {currentSubmission.文档核心内容 && (
                  <div>
                    <p className="font-semibold">文档核心内容：</p>
                    <p className="whitespace-pre-wrap">{currentSubmission.文档核心内容}</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardContent>
              {currentSubmission.附件上传 && currentSubmission.附件上传.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">附件：</h3>
                  <ul className="space-y-2">
                    {currentSubmission.附件上传.map((file, index) => (
                      <li key={index}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {file.name}
                        </a>
                      </li>
                    ))}                  
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：其他字段信息 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>论文分析结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 研究方法评分 */}
                {currentSubmission.论文研究方法得分 && (
                  <div>
                    <p className="font-semibold">研究方法评分：</p>
                    <p className="whitespace-pre-wrap">{currentSubmission.论文研究方法得分}</p>
                    <p className="text-sm text-gray-600 mt-1">{currentSubmission.论文研究方法完整分析}</p>
                  </div>
                )}
                
                {/* 论文结构评分 */}
                {currentSubmission.论文结构得分 && (
                  <div>
                    <p className="font-semibold">论文结构评分：</p>
                    <p className="whitespace-pre-wrap">{currentSubmission.论文结构得分}</p>
                    <p className="text-sm text-gray-600 mt-1">{currentSubmission.论文结构完整分析}</p>
                  </div>
                )}

                {/* 论证逻辑评分 */}
                {currentSubmission.论文论证逻辑得分 && (
                  <div>
                    <p className="font-semibold">论证逻辑评分：</p>
                    <p className="whitespace-pre-wrap">{currentSubmission.论文论证逻辑得分}</p>
                    <p className="text-sm text-gray-600 mt-1">{currentSubmission.论文论证逻辑完整分析}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}