"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePaperStore } from "@/store/paper-store"

export default function Result() {
  const { paperContent } = usePaperStore()
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">评分结果</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border rounded-lg p-4 overflow-auto h-[calc(100vh-200px)]">
          <h2 className="text-xl font-semibold mb-4">论文内容</h2>
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {paperContent || "暂无内容，请先上传论文文件。"}
          </pre>
        </div>
        <div className="border rounded-lg p-4 overflow-auto h-[calc(100vh-200px)]">
          <h2 className="text-xl font-semibold mb-4">评分与建议</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">总体评分：85/100</h3>
              <p className="text-sm text-gray-600">优秀的工作！有一些小的改进空间。</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">结构：90/100</h3>
              <p className="text-sm text-gray-600">论文结构清晰，逻辑流畅。</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">内容：85/100</h3>
              <p className="text-sm text-gray-600">论点有力，但某些地方可以提供更多证据支持。</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">语言：80/100</h3>
              <p className="text-sm text-gray-600">整体表达清晰，但有些句子可以更简洁。</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">改进建议：</h3>
              <ul className="list-disc list-inside text-sm text-gray-600">
                <li>在第三段增加更多的数据支持您的论点</li>
                <li>检查并修正参考文献的格式</li>
                <li>考虑在结论部分增加对未来研究方向的讨论</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center">
        <Link href="/">
          <Button>返回上传页面</Button>
        </Link>
      </div>
    </div>
  )
}

