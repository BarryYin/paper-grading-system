'use client';

import { useEffect, useState } from 'react';
import { usePaperStore } from '@/store/paper-store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

interface Paper {
  id: string;
  论文标题: string;
}

interface PaginationData {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function PaperTitleList() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({ 
    total: 0,
    page: 1,
    page_size: 8,
    total_pages: 0
  });

  const fetchPapers = async (page: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/submissions?page=${page}&page_size=${pagination.page_size}`, {
        credentials: 'include', // 添加credentials选项，确保发送cookie
      });
      if (!response.ok) {
        throw new Error('获取论文列表失败');
      }
      const data = await response.json();
      setPapers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentPage = pagination.page;
    fetchPapers(currentPage);
  }, []);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchPapers(newPage);
  };

  if (loading) {
    return <div className="container mx-auto py-8">加载中...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8 text-red-500">{error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>论文列表</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>论文标题</TableHead>
              <TableHead className="w-24">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {papers.map((paper) => (
              <TableRow key={paper.id}>
                <TableCell>{paper.论文标题}</TableCell>
                <TableCell>
                  <Link 
                    href={`/result/${paper.id}`}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    查看详情
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 分页控制 */}
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            上一页
          </Button>
          <span className="py-2 px-4">
            第 {pagination.page} 页，共 {pagination.total_pages} 页
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.total_pages}
          >
            下一页
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}