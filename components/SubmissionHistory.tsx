'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePaperStore } from '@/store/paper-store'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function SubmissionHistory() {
  const { submissions, loadSubmissionHistory } = usePaperStore()
  const router = useRouter()

  useEffect(() => {
    loadSubmissionHistory()
  }, [])

  return (
    <Card className="mt-8">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">提交历史</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>论文标题</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow 
                key={submission.id} 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => router.push(`/result/${submission.id}`)}
              >
                <TableCell>{submission.论文标题 || '无标题'}</TableCell>
              </TableRow>
            ))}
            {submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={1} className="text-center">暂无提交记录</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}