import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FileUploadButton from '../components/FileUploadButton'

import PaperTitleList from '@/components/PaperTitleList';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f2f2f7] to-[#e5e5ea] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-semibold mb-10 text-[#1d1d1f] tracking-tight bg-gradient-to-r from-[#1d1d1f] to-[#434344] inline-block text-transparent bg-clip-text text-center">论文评分系统</h1>
        <div className="backdrop-blur-lg bg-white/80 rounded-3xl shadow-lg p-8 border border-white/40 hover:shadow-xl transition-all duration-300">
          <Label htmlFor="file-upload" className="text-xl font-medium mb-4 block text-center text-[#1d1d1f] tracking-tight">
            上传您的论文
          </Label>
          <div className="flex justify-center">
            <FileUploadButton />
          </div>
          <p className="text-sm text-[#86868b] mt-3 text-center">支持 PDF, DOC, DOCX 格式</p>
        </div>
        <div className="mt-8 backdrop-blur-lg bg-white/80 rounded-3xl shadow-lg p-8 border border-white/40">
          <h2 className="text-2xl font-medium mb-5 text-[#1d1d1f] tracking-tight">使用说明</h2>
          <ol className="list-decimal list-inside space-y-3 text-[#1d1d1f]">
            <li className="p-2 bg-[#f5f5f7]/70 backdrop-blur-sm rounded-xl shadow-inner border border-white/40">点击"选择文件"按钮或将文件拖放到上方区域</li>
            <li className="p-2 bg-[#f5f5f7]/70 backdrop-blur-sm rounded-xl shadow-inner border border-white/40">选择您要上传的论文文件（PDF、DOC或DOCX格式）</li>
            <li className="p-2 bg-[#f5f5f7]/70 backdrop-blur-sm rounded-xl shadow-inner border border-white/40">文件上传后，系统将自动分析您的论文</li>
            <li className="p-2 bg-[#f5f5f7]/70 backdrop-blur-sm rounded-xl shadow-inner border border-white/40">分析完成后，您将被重定向到结果页面</li>
          </ol>
        </div>
        <div className="mt-8 backdrop-blur-lg bg-white/80 rounded-3xl shadow-lg p-8 border border-white/40">
          <PaperTitleList />
        </div>
        <div className="mt-8 text-center">
          <Link href="/result">
            <Button className="bg-gradient-to-r from-[#0066cc] to-[#5ac8fa] hover:from-[#0077ED] hover:to-[#60d3ff] text-white font-medium px-6 py-2.5 rounded-full text-sm shadow-md transition-all duration-300 transform hover:-translate-y-0.5">查看示例结果</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

