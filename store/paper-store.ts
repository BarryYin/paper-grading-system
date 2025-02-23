import { create } from 'zustand'

type PaperStore = {
  paperContent: string
  setPaperContent: (content: string) => void
}

export const usePaperStore = create<PaperStore>((set) => ({
  paperContent: '',
  setPaperContent: (content: string) => set({ paperContent: content })
}))