/*
 * @file: /Users/i104/EmailForward/src/store/emailTemplate.store.ts
 * @author: dongyang
 */
import { create } from "zustand";
import type { EmailTemplate } from "@/types/email";
import type { EmailTemplateState } from "@/types/store";

/**
 * 邮件模板 Store
 */
export const useEmailTemplateStore = create<EmailTemplateState>((set) => ({
  templates: [],
  fileLoading: false,
  sendAllLoading: false,
  error: undefined,

  setTemplates: (templates: EmailTemplate[]) => set({ templates }),
  setFileLoading: (fileLoading: boolean) => set({ fileLoading }),
  setSendAllLoading: (sendAllLoading: boolean) => set({ sendAllLoading }),
  setError: (error?: string) => set({ error }),
  clearTemplates: () => set({ templates: [], error: undefined }),
}));
