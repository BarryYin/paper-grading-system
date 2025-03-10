'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Submission {
  id: string;
  论文标题?: string;
  提交时间?: string;
  [key: string]: any;
}

export default function SubmissionsList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch('/api/submissions', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          }
        });
        
        if (!response.ok) {
          throw new Error(`获取论文列表失败: ${response.status}`);
        }
        
        const data = await response.json();
        setSubmissions(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
        console.error('获取论文列表失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

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

  if (!submissions.length) {
    return (
      <div className="container mx-auto p-8">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-600">暂无论文提交记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f2f2f7] to-[#e5e5ea] p-4 md:p-8 lg:p-12">
      <div className="max-w-[90rem] mx-auto">
        {/* 标题区域 - 更大更醒目 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#1d1d1f] tracking-tight bg-gradient-to-r from-[#1d1d1f] via-[#434344] to-[#666] inline-block text-transparent bg-clip-text">
            论文提交列表
          </h1>
          <div className="w-24 h-1.5 bg-gradient-to-r from-[#0066cc] to-[#5ac8fa] mx-auto rounded-full"></div>
        </div>
        
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl p-8 md:p-10 border border-white/50 hover:shadow-2xl transition-all duration-500">
          <div className="overflow-hidden rounded-2xl">
            <table className="min-w-full divide-y divide-gray-100/50">
              <thead className="bg-[#f5f5f7]/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#1d1d1f] tracking-wide">论文标题</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#1d1d1f] tracking-wide">提交时间</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#1d1d1f] tracking-wide">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-100/50">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-[#f5f5f7]/80 transition-colors duration-300">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-base font-medium text-[#1d1d1f]">
                        {submission.论文标题 || '无标题'}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-base text-[#424245]">
                        {submission.提交时间 || '未知时间'}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <Link 
                        href={`/submissions/${submission.id}`}
                        className="inline-flex items-center text-[#0066cc] hover:text-[#0077ED] transition-all duration-300 bg-white/50 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-sm border border-white/40 hover:shadow-md"
                      >
                        <span className="font-medium">查看详情</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}