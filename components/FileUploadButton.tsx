"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { usePaperStore } from "@/store/paper-store"
import mammoth from "mammoth"

export function FileUploadButton() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [syncStatus, setSyncStatus] = useState('')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setSyncStatus('正在读取文件...')
      
      let content = '';
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        setUploadProgress(30);
        setSyncStatus('正在解析文档...');
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else {
        content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 30));
            }
          };
          reader.readAsText(file);
        });
      }

      setUploadProgress(50);
      setSyncStatus('正在同步到服务器...');
      
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const data = await response.json();
      const recordId = data.data.recordId;
      usePaperStore.getState().setPaperContent(content);
      usePaperStore.getState().setRecordId(recordId);
      
      setUploadProgress(100);
      setIsSuccess(true);
      toast.success("论文上传成功！");
    } catch (error) {
      console.error('文件处理失败:', error);
      toast.error("上传失败，请确保文件格式正确并重试");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      setSyncStatus('');
    }
  }

  const goToAnalysis = () => {
    const recordId = usePaperStore.getState().recordId
    if (recordId) {
      router.push(`/result/${recordId}`)
    } else {
      toast.error("获取论文ID失败，请重试")
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
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
        className="w-full"
      >
        {isUploading ? "上传中..." : "选择文件"}
      </Button>
      
      {isUploading && (
        <div className="w-full space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">{syncStatus}</p>
        </div>
      )}
      
      {isSuccess && (
        <Button
          onClick={goToAnalysis}
          disabled={!isSuccess}
          className="w-full"
        >
          查看分析结果
        </Button>
      )}
    </div>
  )
}