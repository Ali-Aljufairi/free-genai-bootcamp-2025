import { create } from 'zustand'

interface SidebarState {
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
}

export const useSidebar = create<SidebarState>((set) => ({
  isExpanded: true,
  setIsExpanded: (expanded) => set({ isExpanded: expanded }),
})) 