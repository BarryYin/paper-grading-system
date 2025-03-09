'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Pagination } from './ui/pagination';
import { useAuth } from '@/hooks/use-auth';

// 定义论文数据类型
interface Submission {
  id: string;
  username?: string;
  论文标题: string;
  论文研究方法得分: string;
  论文结构得分: string;
  论文论证逻辑得分: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function PaperTitleList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    page_size: 8,
    total_pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // 加载论文数据
  const fetchSubmissions = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/submissions?page=${page}&page_size=${pagination.page_size}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        }
      });

      if (!response.ok) {
        throw new Error(`服务器返回错误: ${response.status}`);
      }

      const data = await response.json();
      setSubmissions(data.data);
      
      setPagination({
        total: data.pagination.total,
        page: data.pagination.page,
        page_size: data.pagination.page_size,
        total_pages: data.pagination.total_pages
      });
    } catch (error) {
      console.error("获取论文列表失败:", error);
      setError("获取论文数据时出错，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和页码变化时获取数据
  useEffect(() => {
    fetchSubmissions(pagination.page);
  }, [pagination.page]);

  // 切换页码
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.total_pages) return;
    setPagination(prev => ({ ...prev, page }));
  };

  // 渲染论文卡片
  const renderCards = () => {
    if (submissions.length === 0) {
      return <p className="text-center text-gray-500">暂无论文数据</p>;
    }

    return submissions.map((submission) => (
      <Card key={submission.id} className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            {submission.论文标题 || "处理中..."}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">研究方法</p>
              <p className="text-lg font-medium">{submission.论文研究方法得分 || "-"}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">结构</p>
              <p className="text-lg font-medium">{submission.论文结构得分 || "-"}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">论证逻辑</p>
              <p className="text-lg font-medium">{submission.论文论证逻辑得分 || "-"}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href={`/submissions/${submission.id}`}>
            <Button variant="outline">查看详情</Button>
          </Link>
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">我的论文</h2>
      </div>

      {loading ? (
        <div className="text-center py-8">正在加载论文列表...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <>
          <div className="space-y-4">{renderCards()}</div>
          {pagination.total_pages > 1 && (
            <Pagination className="mt-4 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="mr-2"
              >
                上一页
              </Button>
              <span className="flex items-center mx-2">
                第 {pagination.page} 页，共 {pagination.total_pages} 页
              </span>
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.total_pages}
                className="ml-2"
              >
                下一页
              </Button>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}