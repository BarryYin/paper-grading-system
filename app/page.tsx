import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FileUploadButton from '../components/FileUploadButton'

import PaperTitleList from '@/components/PaperTitleList';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">论文评分系统</h1>
      <div className="max-w-2xl mx-auto">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Label htmlFor="file-upload" className="text-lg font-semibold mb-2 block">
            上传您的论文
          </Label>
          <FileUploadButton />
          <p className="text-sm text-gray-500 mt-2">支持 PDF, DOC, DOCX 格式</p>
        </div>
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">使用说明</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>点击"选择文件"按钮或将文件拖放到上方区域</li>
            <li>选择您要上传的论文文件（PDF、DOC或DOCX格式）</li>
            <li>文件上传后，系统将自动分析您的论文</li>
            <li>分析完成后，您将被重定向到结果页面</li>
          </ol>
        </div>
        <div className="mt-8">
          <PaperTitleList />
        </div>
        <div className="mt-8 text-center">
          <Link href="/result">
            <Button>查看示例结果</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

