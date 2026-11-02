import { create } from 'zustand';

interface UIState {
  activeCardId: string | null;
  isCardModalOpen: boolean;
  activeDragId: string | null;
  activeDragType: 'card' | 'list' | null;
  setActiveCardId: (id: string | null) => void;
  setCardModalOpen: (open: boolean) => void;
  setActiveDrag: (id: string | null, type: 'card' | 'list' | null) => void;
}

/**
 * Zustand Store quản lý trạng thái UI gọn nhẹ, tối ưu performance không re-render toàn app
 */
export const useUIStore = create<UIState>((set) => ({
  activeCardId: null,
  isCardModalOpen: false,
  activeDragId: null,
  activeDragType: null,
  setActiveCardId: (id) => set({ activeCardId: id, isCardModalOpen: !!id }),
  setCardModalOpen: (open) => set({ isCardModalOpen: open, activeCardId: open ? undefined : null }),
  setActiveDrag: (id, type) => set({ activeDragId: id, activeDragType: type }),
}));

