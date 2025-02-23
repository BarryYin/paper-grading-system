"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function FileUploadButton() {
  return (
    <>
      <Input id="file-upload" type="file" className="hidden" accept=".pdf,.doc,.docx" />
      <Button onClick={() => document.getElementById("file-upload")?.click()} className="mt-4">
        选择文件
      </Button>
    </>
  )
}