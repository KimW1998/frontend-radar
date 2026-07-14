import { create } from 'zustand'
import type { DetailContent } from '@/types/detail'

interface DetailState {
  open: boolean
  content: DetailContent | null
  showDetail: (content: DetailContent) => void
  hideDetail: () => void
}

export const useDetailStore = create<DetailState>()((set) => ({
  open: false,
  content: null,
  showDetail: (content) => set({ open: true, content }),
  hideDetail: () => set({ open: false, content: null }),
}))
