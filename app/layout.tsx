import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import AuthComponents from "@/components/AuthComponents"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/hooks/use-auth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "论文评分系统",
  description: "上传您的论文并获得详细的评分和改进建议",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <header className="border-b py-4 px-6 flex justify-between items-center">
            <h1 className="text-xl font-bold">论文评分系统</h1>
            <AuthComponents />
          </header>
          <main>
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}

// 确保导入全局样式
import './globals.css';