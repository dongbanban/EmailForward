/*
 * @file: /Users/i104/EmailForward/src/types/store.ts
 * @author: dongyang
 */
import type { EmailTemplate } from "./email";

/**
 * 邮件模板状态管理
 */
export interface EmailTemplateState {
  /** 模板列表 */
  templates: EmailTemplate[];
  /** 文件读取加载状态 */
  fileLoading: boolean;
  /** 批量发送加载状态 */
  sendAllLoading: boolean;
  /** 错误信息 */
  error?: string;

  /** 设置模板列表 */
  setTemplates: (templates: EmailTemplate[]) => void;
  /** 设置文件加载状态 */
  setFileLoading: (fileLoading: boolean) => void;
  /** 设置批量发送加载状态 */
  setSendAllLoading: (sendAllLoading: boolean) => void;
  /** 设置错误信息 */
  setError: (error?: string) => void;
  /** 清空模板列表 */
  clearTemplates: () => void;
}
