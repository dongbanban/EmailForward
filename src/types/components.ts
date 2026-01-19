/*
 * @file: /Users/i104/EmailForward/src/types/components.ts
 * @author: dongyang
 */
import type { ReactNode } from "react";
import type { EmailTemplate } from "./email";

/**
 * 布局组件属性
 */
export interface AppLayoutProps {
  children: ReactNode;
  menu: ReactNode;
}

/**
 * 预览弹窗组件属性
 */
export interface PreviewModalProps {
  visible: boolean;
  template: EmailTemplate;
  onClose: () => void;
  onSend: () => void;
}

/**
 * 发送弹窗组件属性
 */
export interface SendModalProps {
  visible: boolean;
  template: EmailTemplate;
  onClose: () => void;
  onSend: (recipient?: string) => void;
}
