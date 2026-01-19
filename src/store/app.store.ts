import { create } from "zustand";
import type { AppState } from "@/types/app";

/**
 * 应用 Store 状态
 */
interface AppStore extends AppState {
  /** 设置选中的菜单 */
  setSelectedMenu: (menu: string) => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 设置错误信息 */
  setError: (error?: string) => void;
}

/**
 * 应用全局 Store
 */
export const useAppStore = create<AppStore>((set) => ({
  selectedMenu: "email-management",
  loading: false,
  error: undefined,

  setSelectedMenu: (menu: string) => set({ selectedMenu: menu }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error?: string) => set({ error }),
}));
