"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { usePaperStore } from "@/store/paper-store"
import mammoth from "mammoth"

export function FileUploadButton() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        usePaperStore.getState().setPaperContent(result.value)
      } else {
        const reader = new FileReader()
        
        reader.onload = async (e) => {
          const content = e.target?.result as string
          usePaperStore.getState().setPaperContent(content)
        }

        reader.readAsText(file)
      }
      
      setIsSuccess(true)
      toast.success("论文上传成功！")
    } catch (error) {
      toast.error("上传失败，请重试")
    } finally {
      setIsUploading(false)
    }
  }

  const goToAnalysis = () => {
    router.push("/result")
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Input
        id="file-upload"
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx"
        onChange={handleFileUpload}
        disabled={isUploading}
      />
      <Button
        onClick={() => document.getElementById("file-upload")?.click()}
        disabled={isUploading}
      >
        {isUploading ? "上传中..." : "选择文件"}
      </Button>
      {isSuccess && (
        <Button
          onClick={goToAnalysis}
          variant="secondary"
          className="animate-fade-in"
        >
          查看分析结果
        </Button>
      )}
    </div>
  )
}