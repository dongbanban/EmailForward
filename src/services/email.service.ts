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
      // 确定收件人列表：如果指定了收件人则使用单个收件人，否则使用配置中的所有收件人
      const recipients = request.to ? [request.to] : emailConfig.recipients;

      if (!recipients || recipients.length === 0) {
        return {
          success: false,
          message: "Failed to send",
          error: "No recipient specified and no default recipient in config",
        };
      }

      // 给所有收件人发送邮件
      const results = [];
      for (const recipient of recipients) {
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
          results.push({
            recipient,
            success: false,
            error: error.error || error.message,
          });
        } else {
          const result = await response.json();
          results.push({
            recipient,
            success: true,
            ...result,
          });
        }

        // 多个收件人时添加延迟，避免发送过快
        if (recipients.length > 1) {
          await this.delay(emailConfig.sendOptions.retryDelay);
        }
      }

      // 汇总结果
      const successCount = results.filter((r) => r.success).length;
      const failedResults = results.filter((r) => !r.success);

      if (successCount === results.length) {
        return {
          success: true,
          message: `Successfully sent to ${successCount} recipient(s)`,
        };
      } else if (successCount === 0) {
        return {
          success: false,
          message: "Failed to send to all recipients",
          error: failedResults
            .map((r) => `${r.recipient}: ${r.error}`)
            .join("; "),
        };
      } else {
        return {
          success: true,
          message: `Partially sent: ${successCount} succeeded, ${failedResults.length} failed`,
          error: failedResults
            .map((r) => `${r.recipient}: ${r.error}`)
            .join("; "),
        };
      }
    } catch (error) {
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
