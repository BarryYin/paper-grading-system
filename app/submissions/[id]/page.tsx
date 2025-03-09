'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Submission {
  id: string;
  论文标题?: string;
  文档核心内容?: string;
  论文目录?: string;
  论文采用论证方法?: string;
  附件上传?: Array<{ name: string; url: string }>;
  附件内容摘要?: string;
  论文研究方法得分?: string;
  论文研究方法修改意见?: string;
  论文结构得分?: string;
  论文结构修改意见?: string;
  论文论证逻辑得分?: string;
  论文论证逻辑修改意见?: string;
  论文结论?: string;
  [key: string]: any; // 允许其他可能的字段
}

export default function SubmissionDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/submissions/${params.id}`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          }
        });
        
        if (!response.ok) {
          throw new Error(`获取论文详情失败: ${response.status}`);
        }
        
        const data = await response.json();
        setSubmission(data);
      } catch (err) {
        console.error('获取论文详情失败:', err);
        setError(err instanceof Error ? err.message : '获取论文数据时出错，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center">
        <p className="text-lg">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto p-8">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-600">未找到论文</p>
        </div>
      </div>
    );
  }

  // 渲染论文拆解信息（左侧内容）
  const renderPaperInfo = () => {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        {/* 论文标题 */}
        {submission.论文标题 && (
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">论文标题:</h3>
            <div className="whitespace-pre-wrap">{submission.论文标题}</div>
          </div>
        )}
        
        {/* 文档核心内容 */}
        {submission.文档核心内容 && (
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">文档核心内容:</h3>
            <div className="whitespace-pre-wrap">{submission.文档核心内容}</div>
          </div>
        )}
        
      
        
     
        
       
        
        {/* 附件内容摘要 */}
        {submission.附件内容摘要 && (
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">附件内容摘要:</h3>
            <div className="whitespace-pre-wrap">{submission.附件内容摘要}</div>
          </div>
        )}
      </div>
    );
  };

  // 渲染评分及建议（右侧内容）
  const renderGradingInfo = () => {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">评分及建议</h2>
        
        {/* 研究方法评分 */}
        <div className="mb-6 border-b pb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-lg">研究方法</h3>
            {submission.论文研究方法得分 && (
              <span className="bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded-full">
                得分: {submission.论文研究方法得分}
              </span>
            )}
          </div>
          {submission.论文研究方法修改意见 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">修改意见:</h4>
              <div className="whitespace-pre-wrap text-gray-600">{submission.论文研究方法修改意见}</div>
            </div>
          )}
        </div>
        
        {/* 论文结构评分 */}
        <div className="mb-6 border-b pb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-lg">论文结构</h3>
            {submission.论文结构得分 && (
              <span className="bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded-full">
                得分: {submission.论文结构得分}
              </span>
            )}
          </div>
          {submission.论文结构修改意见 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">修改意见:</h4>
              <div className="whitespace-pre-wrap text-gray-600">{submission.论文结构修改意见}</div>
            </div>
          )}
        </div>
        
        {/* 论证逻辑评分 */}
        <div className="mb-6 border-b pb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-lg">论证逻辑</h3>
            {submission.论文论证逻辑得分 && (
              <span className="bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded-full">
                得分: {submission.论文论证逻辑得分}
              </span>
            )}
          </div>
          {submission.论文论证逻辑修改意见 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">修改意见:</h4>
              <div className="whitespace-pre-wrap text-gray-600">{submission.论文论证逻辑修改意见}</div>
            </div>
          )}
        </div>
        
        {/* 论文结论 */}
        {submission.论文结论 && (
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">论文结论:</h3>
            <div className="whitespace-pre-wrap">{submission.论文结论}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-8">
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
      
      <h1 className="text-2xl font-bold mb-6">
        {submission.论文标题 || '论文详情'}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧：论文拆解信息 */}
        <div className="col-span-1">
          <h2 className="text-xl font-bold mb-4">论文拆解信息</h2>
          {renderPaperInfo()}
        </div>
        
        {/* 右侧：评分及建议 */}
        <div className="col-span-1">
          {renderGradingInfo()}
        </div>
      </div>
    </div>
  );
}