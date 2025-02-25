import { create } from 'zustand'

interface PaperSubmission {
  id: string
  title: string
  content: string
  status: 'pending' | 'completed'
  result?: string
  createdAt: string
  attachment?: {
    name: string
    url: string
    type: string
  }[]
}

interface PaperStore {
  paperContent: string;
  submissions: PaperSubmission[];
  currentSubmission: PaperSubmission | null;
  setPaperContent: (content: string) => void;
  submitPaper: (content: string) => Promise<string>;
  loadSubmissionHistory: () => Promise<void>;
  getSubmissionResult: (id: string) => Promise<void>;
}

export const usePaperStore = create<PaperStore>((set) => ({
  paperContent: '',
  submissions: [],
  currentSubmission: null,

  setPaperContent: (content) => set({ paperContent: content }),

  submitPaper: async (content) => {
    try {
      const response = await fetch('/api/feishu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await response.json();
      return data.recordId;
    } catch (error) {
      console.error('提交论文失败：', error);
      throw error;
    }
  },

  loadSubmissionHistory: async () => {
    try {
      const response = await fetch('/api/feishu');
      const data = await response.json();
      set({ submissions: data || [] });
    } catch (error) {
      console.error('加载提交历史失败：', error);
      throw error;
    }
  },

  getSubmissionResult: async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/api/submissions/${id}`);
      const data = await response.json();
      set({ currentSubmission: data || null });
    } catch (error) {
      console.error('获取提交结果失败：', error);
      throw error;
    }
  }
}))