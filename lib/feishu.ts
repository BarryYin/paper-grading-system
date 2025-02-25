interface PaperSubmission {
  id: string
  论文标题: string
  文档核心内容: string
  论文目录?: string
  论文研究方法修改意见?: string
  论文研究方法得分?: string
  论文结构修改意见?: string
  论文结构得分?: string
  论文结论?: string
  论文论证逻辑修改意见?: string
  论文论证逻辑得分?: string
  论文采用论证方法?: string
  附件上传?: {
    name: string
    url: string
    type: string
  }[]
  附件内容摘要?: string
}

export class FeishuService {
  private baseUrl: string

  constructor() {
    this.baseUrl = 'http://localhost:8000'
  }

  async submitPaper(content: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/feishu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      throw new Error('Failed to submit paper')
    }

    const data = await response.json()
    return data.recordId
  }

  async getSubmissionResult(recordId: string): Promise<PaperSubmission | null> {
    const response = await fetch(`${this.baseUrl}/api/feishu?recordId=${recordId}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to get submission result')
    }

    return response.json()
  }

  async getSubmissionHistory(): Promise<PaperSubmission[]> {
    const response = await fetch(`${this.baseUrl}/api/submissions`)

    if (!response.ok) {
      throw new Error('Failed to get submission history')
    }

    const { data } = await response.json()
    return data
  }
}