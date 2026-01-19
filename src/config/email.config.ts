/*
 * @file: /Users/i104/EmailForward/src/config/email.config.ts
 * @author: dongyang
 */
import type { EmailConfig } from "@/types/email";

/**
 * Email Configuration
 * Please modify the following configuration according to your needs
 */
export const emailConfig: EmailConfig = {
  smtp: {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "your-email@gmail.com", // Replace with your Gmail address
      pass: "your-app-password", // Replace with your app-specific password
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  },
  from: {
    name: "Email Forward",
    email: "your-email@gmail.com", // Sender email must match SMTP auth account
  },
  replyTo: {
    name: "Email Forward",
    email: "your-email@gmail.com",
  },
  recipients: ["recipient@example.com"], // Default recipient list, leave empty to require manual input
  sendOptions: {
    retryTimes: 3,
    retryDelay: 1000,
  },
  defaultTemplatePath: "", // 默认模板文件路径，空则不自动加载
};
