'use client';

import { useEffect } from 'react';
import { usePaperStore } from '@/store/paper-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaperResult({ params }: { params: { id: string } }) {
  const { currentSubmission, getSubmissionResult } = usePaperStore();

  useEffect(() => {
    getSubmissionResult(params.id);
  }, [params.id, getSubmissionResult]);

  if (!currentSubmission) {
    return <div className="container mx-auto py-8">加载中...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-2 gap-8">
        {/* 左侧：论文内容和附件 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{currentSubmission.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap mb-4">
                {currentSubmission.content}
              </div>
              {currentSubmission.attachment && currentSubmission.attachment.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">附件：</h3>
                  <ul className="space-y-2">
                    {currentSubmission.attachment.map((file, index) => (
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
                    <p className="text-sm text-gray-600 mt-1">{currentSubmission.论文研究方法修改意见}</p>
                  </div>
                )}
                
                {/* 论文结构评分 */}
                {currentSubmission.论文结构得分 && (
                  <div>
                    <p className="font-semibold">论文结构评分：</p>
                    <p className="whitespace-pre-wrap">{currentSubmission.论文结构得分}</p>
                    <p className="text-sm text-gray-600 mt-1">{currentSubmission.论文结构修改意见}</p>
                  </div>
                )}

                {/* 论证逻辑评分 */}
                {currentSubmission.论文论证逻辑得分 && (
                  <div>
                    <p className="font-semibold">论证逻辑评分：</p>
                    <p className="whitespace-pre-wrap">{currentSubmission.论文论证逻辑得分}</p>
                    <p className="text-sm text-gray-600 mt-1">{currentSubmission.论文论证逻辑修改意见}</p>
                  </div>
                )}

                {/* 论文结论 */}
                {currentSubmission.论文结论 && (
                  <div>
                    <p className="font-semibold">论文结论：</p>
                    <p className="whitespace-pre-wrap">{currentSubmission.论文结论}</p>
                  </div>
                )}

                {/* 论文采用论证方法 */}
                {currentSubmission.论文采用论证方法 && (
                  <div>
                    <p className="font-semibold">采用的论证方法：</p>
                    <p className="whitespace-pre-wrap">{currentSubmission.论文采用论证方法}</p>
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