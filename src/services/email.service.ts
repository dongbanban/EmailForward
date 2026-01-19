import { emailConfig } from "@/config/email.config";
import type {
  SendEmailRequest,
  SendEmailResult,
  EmailTemplate,
} from "@/types/email";

/**
 * 邮件服务类
 * 通过后端 API 发送邮件
 */
class EmailService {
  private apiUrl = `${window.location.origin}/api`;

  /**
   * 发送单个邮件
   * @param request 邮件发送请求
   * @returns 发送结果
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResult> {
    try {
      // 使用默认收件人或指定收件人
      const recipient = request.to || emailConfig.recipients[0];

      if (!recipient) {
        return {
          success: false,
          message: "Failed to send",
          error: "No recipient specified and no default recipient in config",
        };
      }

      console.log(`Sending email to: ${recipient}`);

      // 调用后端 API
      const response = await fetch(`${this.apiUrl}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipient,
          subject: request.subject,
          html: request.html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: "Failed to send email",
          error: error.error || error.message,
        };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to send email:", error);
      return {
        success: false,
        message: "Failed to send email",
        error: String(error),
      };
    }
  }

  /**
   * 批量发送邮件
   * @param templates 邮件模板列表
   * @param recipient 收件人（可选）
   * @returns 发送结果列表
   */
  async sendBatchEmails(
    templates: EmailTemplate[],
    recipient?: string
  ): Promise<SendEmailResult[]> {
    const results: SendEmailResult[] = [];

    for (const template of templates) {
      try {
        const result = await this.sendEmail({
          to: recipient,
          subject: template.fileName,
          html: template.htmlContent || "",
        });
        results.push(result);

        // 添加延迟，避免发送过快
        await this.delay(emailConfig.sendOptions.retryDelay);
      } catch (error) {
        results.push({
          success: false,
          message: "Failed to send",
          error: String(error),
        });
      }
    }

    return results;
  }

  /**
   * 延迟函数
   * @param ms 延迟毫秒数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const emailService = new EmailService();
