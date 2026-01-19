/*
 * @file: /Users/i104/EmailForward/src/types/email.ts
 * @author: dongyang
 */
/**
 * 邮件模板类型定义
 */
export interface EmailTemplate {
  /** 模板文件名 */
  fileName: string;
  /** 模板相对路径 */
  relativePath: string;
  /** 模板完整路径 */
  fullPath: string;
  /** HTML 内容 */
  htmlContent?: string;
}

/**
 * SMTP 配置类型
 */
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  requireTLS?: boolean;
  connectionTimeout?: number;
  greetingTimeout?: number;
  socketTimeout?: number;
  auth: {
    user: string;
    pass: string;
  };
  tls: {
    rejectUnauthorized: boolean;
  };
}

/**
 * 邮件发件人信息
 */
export interface EmailSender {
  name: string;
  email: string;
}

/**
 * 邮件发送选项
 */
export interface SendOptions {
  /** 重试次数 */
  retryTimes: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
}

/**
 * 完整的邮件配置
 */
export interface EmailConfig {
  /** SMTP 服务器配置 */
  smtp: SMTPConfig;
  /** 发件人信息 */
  from: EmailSender;
  /** 回复地址 */
  replyTo: EmailSender;
  /** 默认收件人列表 */
  recipients: string[];
  /** 发送选项 */
  sendOptions: SendOptions;
  /** 默认模板文件路径（空则不自动加载） */
  defaultTemplatePath?: string;
}

/**
 * 邮件发送请求参数
 */
export interface SendEmailRequest {
  /** 收件人邮箱（可选，不填则使用默认收件人） */
  to?: string;
  /** 邮件主题 */
  subject: string;
  /** HTML 内容 */
  html: string;
}

/**
 * 邮件发送结果
 */
export interface SendEmailResult {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message: string;
  /** 错误信息（如果失败） */
  error?: string;
}
