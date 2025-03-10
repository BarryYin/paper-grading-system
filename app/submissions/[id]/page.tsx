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
        const response = await fetch(`/api/submissions/${params.id}`, {
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
      <div className="min-h-screen bg-gradient-to-b from-[#f2f2f7] to-[#e5e5ea] flex justify-center items-center">
        <div className="flex flex-col items-center backdrop-blur-lg bg-white/70 p-8 rounded-3xl shadow-lg">
          <div className="w-10 h-10 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-5"></div>
          <p className="text-lg font-medium text-[#1d1d1f] tracking-tight">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f2f2f7] to-[#e5e5ea] p-8">
        <div className="max-w-4xl mx-auto backdrop-blur-lg bg-white/80 rounded-3xl shadow-lg p-8 border border-white/40">
          <div className="flex items-center text-[#ff3b30] mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-medium tracking-tight">出错了</h2>
          </div>
          <p className="text-[#1d1d1f] text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f2f2f7] to-[#e5e5ea] p-8">
        <div className="max-w-4xl mx-auto backdrop-blur-lg bg-white/80 rounded-3xl shadow-lg p-8 border border-white/40">
          <div className="flex items-center text-[#ff9500] mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-medium tracking-tight">未找到论文</h2>
          </div>
        </div>
      </div>
    );
  }

  // 渲染论文拆解信息（左侧内容）
  const renderPaperInfo = () => {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-100/50 h-fit">
        {/* 论文标题 */}
        {submission.论文标题 && (
          <div className="mb-8">
            <h3 className="font-semibold text-2xl mb-4 text-gray-900 flex items-center">
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 w-2 h-6 rounded-full mr-3"></span>
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                论文标题
              </span>
            </h3>
            <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-6 rounded-xl border border-gray-100 text-lg leading-relaxed">{submission.论文标题}</div>
          </div>
        )}

        {/* 文档核心内容 */}
        {submission.文档核心内容 && (
          <div className="mb-10">
            <h3 className="font-medium text-2xl mb-4 text-[#1d1d1f] tracking-tight flex items-center">
              <span className="w-1.5 h-6 bg-gradient-to-b from-[#0066cc] to-[#5ac8fa] rounded-full mr-3"></span>
              文档核心内容
            </h3>
            <div className="whitespace-pre-wrap text-[#1d1d1f] bg-[#f5f5f7]/70 backdrop-blur-sm p-6 rounded-2xl shadow-inner border border-white/40 text-lg leading-relaxed">{submission.文档核心内容}</div>
          </div>
        )}

        {/* 附件内容摘要 */}
        {submission.附件内容摘要 && (
          <div className="mb-10">
            <h3 className="font-medium text-2xl mb-4 text-[#1d1d1f] tracking-tight flex items-center">
              <span className="w-1.5 h-6 bg-gradient-to-b from-[#0066cc] to-[#5ac8fa] rounded-full mr-3"></span>
              附件内容摘要
            </h3>
            <div className="whitespace-pre-wrap text-[#1d1d1f] bg-[#f5f5f7]/70 backdrop-blur-sm p-6 rounded-2xl shadow-inner border border-white/40 text-lg leading-relaxed">{submission.附件内容摘要}</div>
          </div>
        )}
      </div>
    );
  };

  // 渲染评分及建议（右侧内容）
  const renderGradingInfo = () => {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100/50 hover:shadow-xl transition-all duration-300">
        <h2 className="text-3xl font-semibold mb-8 text-gray-900 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">评分及建议</h2>
        {/* 研究方法评分 */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <h3 className="font-semibold text-2xl text-gray-900 flex items-center">
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 w-2 h-6 rounded-full mr-3"></span>
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">研究方法</span>
            </h3>
            {submission.论文研究方法得分 && (
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium px-6 py-3 rounded-full text-base shadow-sm inline-flex items-center justify-center min-w-[120px] hover:shadow-md transition-shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                得分: {submission.论文研究方法得分}
              </span>
            )}
          </div>
          {submission.论文研究方法修改意见 && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h4 className="font-medium text-lg text-gray-700 mb-4">修改意见</h4>
              <div className="whitespace-pre-wrap text-gray-600 text-lg leading-relaxed">{submission.论文研究方法修改意见}</div>
            </div>
          )}
        </div>

        {/* 论文结构评分 */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <h3 className="font-semibold text-2xl text-gray-900 flex items-center">
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 w-2 h-6 rounded-full mr-3"></span>
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">论文结构</span>
            </h3>
            {submission.论文结构得分 && (
              <span className="bg-gradient-to-r from-[#0066cc] to-[#5ac8fa] text-white font-medium px-6 py-2.5 rounded-full text-base shadow-lg inline-flex items-center justify-center min-w-[100px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                得分: {submission.论文结构得分}
              </span>
            )}
          </div>
          {submission.论文结构修改意见 && (
            <div className="bg-[#f5f5f7]/70 backdrop-blur-sm p-6 rounded-2xl shadow-inner border border-white/40">
              <h4 className="font-medium text-lg text-[#1d1d1f] mb-4 tracking-tight">修改意见:</h4>
              <div className="whitespace-pre-wrap text-[#424245] text-lg leading-relaxed">{submission.论文结构修改意见}</div>
            </div>
          )}
        </div>

        {/* 论证逻辑评分 */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <h3 className="font-semibold text-2xl text-gray-900 flex items-center">
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 w-2 h-6 rounded-full mr-3"></span>
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">论证逻辑</span>
            </h3>
            {submission.论文论证逻辑得分 && (
              <span className="bg-gradient-to-r from-[#0066cc] to-[#5ac8fa] text-white font-medium px-6 py-2.5 rounded-full text-base shadow-lg inline-flex items-center justify-center min-w-[100px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                得分: {submission.论文论证逻辑得分}
              </span>
            )}
          </div>
          {submission.论文论证逻辑修改意见 && (
            <div className="bg-[#f5f5f7]/70 backdrop-blur-sm p-6 rounded-2xl shadow-inner border border-white/40">
              <h4 className="font-medium text-lg text-[#1d1d1f] mb-4 tracking-tight">修改意见:</h4>
              <div className="whitespace-pre-wrap text-[#424245] text-lg leading-relaxed">{submission.论文论证逻辑修改意见}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fafafa] to-[#ececec] p-8">
      <div className="w-[90vw] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 论文信息卡片 */}
        {/* 论文信息卡片 */}
        {renderPaperInfo()}
        {renderGradingInfo()}
      </div>
    </div>
  );
}
