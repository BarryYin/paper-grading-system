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
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">论文提交列表</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">论文标题</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.map((submission) => (
              <tr key={submission.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {submission.论文标题 || '无标题'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {submission.提交时间 || '未知时间'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link 
                    href={`/submissions/${submission.id}`}
                    className="text-blue-600 hover:text-blue-900 hover:underline"
                  >
                    查看详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}