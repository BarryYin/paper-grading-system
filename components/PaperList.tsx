import { useRouter } from 'next/navigation';
import { usePaperStore } from '@/store/paper-store';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PaperList() {
  const router = useRouter();
  const { submissions, loadSubmissionHistory } = usePaperStore();

  useEffect(() => {
    console.log('开始加载提交历史...');
    loadSubmissionHistory();
  }, [loadSubmissionHistory]);

  useEffect(() => {
    console.log('提交历史数据更新：', submissions);
  }, [submissions]);

  const handlePaperClick = (id: string) => {
    router.push(`/result/${id}`);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">论文提交历史</h1>
      <div className="grid gap-4">
        {submissions.map((submission) => (
          <Card
            key={submission.id}
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => handlePaperClick(submission.id)}
          >
            <CardHeader>
              <CardTitle>{submission.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                提交时间：{new Date(submission.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                状态：{submission.status === 'completed' ? '已完成' : '处理中'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}