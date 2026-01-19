import React, { useState, useEffect } from "react";
import { Button, Table, Space, message } from "antd";
import { FolderOpenOutlined, MailOutlined } from "@ant-design/icons";
import { PreviewModal } from "./PreviewModal";
import { SendModal } from "./SendModal";
import useStyles from "./EmailManagement.style";
import { useEmailTemplateStore } from "@/store/emailTemplate.store";
import { templateService } from "@/services/template.service";
import { emailService } from "@/services/email.service";
import { emailConfig } from "@/config/email.config";
import type { EmailTemplate } from "@/types/email";
import type { TableProps } from "antd";

/**
 * 邮件管理页面组件
 */
export const EmailManagement: React.FC = () => {
  const styles = useStyles();
  const {
    templates,
    fileLoading,
    sendAllLoading,
    setTemplates,
    setFileLoading,
    setSendAllLoading,
    setError,
  } = useEmailTemplateStore();

  const [previewVisible, setPreviewVisible] = useState(false);
  const [sendVisible, setSendVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(
    null
  );

  /**
   * 组件加载时自动加载默认模板
   */
  useEffect(() => {
    const loadDefaultTemplates = async () => {
      try {
        const defaultTemplates = await templateService.loadDefaultTemplates();
        if (defaultTemplates.length > 0) {
          setTemplates(defaultTemplates);
          message.success(
            `Auto loaded ${defaultTemplates.length} default templates`
          );
        }
      } catch (error) {
        console.error("Loaded templates Failed:", error);
      }
    };

    loadDefaultTemplates();
  }, [setTemplates]);

  /**
   * 加载模板 - 打开文件系统选择器
   */
  const handleLoadTemplates = async () => {
    try {
      setFileLoading(true);
      setError(undefined);

      // 使用文件系统访问 API 让用户选择目录
      const loadedTemplates =
        await templateService.loadTemplatesFromDirectory();

      if (loadedTemplates.length === 0) {
        message.warning("No HTML template files found");
      } else {
        message.success(
          `Successfully loaded ${loadedTemplates.length} templates`
        );
      }

      setTemplates(loadedTemplates);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load templates";
      message.error(errorMessage);
      setError(errorMessage);
    } finally {
      setFileLoading(false);
    }
  };

  /**
   * 批量发送所有邮件
   */
  const handleSendAll = async () => {
    if (templates.length === 0) {
      message.warning("No templates to send");
      return;
    }

    if (!emailConfig.recipients.length) {
      message.warning(
        "Please configure default recipients or specify recipients when sending"
      );
      return;
    }

    try {
      setSendAllLoading(true);
      message.loading({ content: "Sending batch emails...", key: "sendAll" });

      const results = await emailService.sendBatchEmails(templates);
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        message.success({
          content: `All sent successfully! Total: ${successCount} emails`,
          key: "sendAll",
        });
      } else {
        message.warning({
          content: `Sending completed. Success: ${successCount}, Failed: ${failCount}`,
          key: "sendAll",
        });
      }
    } catch (error) {
      message.error({
        content: "Batch sending failed",
        key: "sendAll",
      });
    } finally {
      setSendAllLoading(false);
    }
  };

  /**
   * 预览模板
   */
  const handlePreview = (template: EmailTemplate) => {
    setCurrentTemplate(template);
    setPreviewVisible(true);
  };

  /**
   * 发送单个模板
   */
  const handleOpenSend = (template: EmailTemplate) => {
    setCurrentTemplate(template);
    setSendVisible(true);
  };

  /**
   * 从预览窗口打开发送对话框
   */
  const handlePreviewToSend = () => {
    setPreviewVisible(false);
    setSendVisible(true);
  };

  /**
   * 发送单个邮件
   */
  const handleSend = async (recipient?: string) => {
    if (!currentTemplate) return;

    try {
      message.loading({ content: "Sending Email...", key: "send" });

      const result = await emailService.sendEmail({
        to: recipient,
        subject: currentTemplate.fileName,
        html: currentTemplate.htmlContent || "",
      });

      if (result.success) {
        message.success({ content: result.message, key: "send" });
        setSendVisible(false);
      } else {
        message.error({ content: result.error || result.message, key: "send" });
      }
    } catch (error) {
      message.error({ content: "Sending failed", key: "send" });
    }
  };

  // 表格列定义
  const columns: TableProps<EmailTemplate>["columns"] = [
    {
      title: "Template Name",
      dataIndex: "fileName",
      key: "fileName",
    },
    {
      title: "Full Path",
      dataIndex: "fullPath",
      key: "fullPath",
    },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handlePreview(record)}>
            View
          </Button>
          <Button type="link" onClick={() => handleOpenSend(record)}>
            Send
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div css={styles.containerStyles}>
      <div css={styles.actionBarStyles}>
        <Space>
          <Button
            icon={<FolderOpenOutlined />}
            onClick={handleLoadTemplates}
            loading={fileLoading}
          >
            Select Template
          </Button>
          <Button
            icon={<MailOutlined />}
            onClick={handleSendAll}
            loading={sendAllLoading}
            disabled={templates.length === 0}
          >
            Send All
          </Button>
        </Space>
        <div css={styles.hintTextStyles}>
          💡 Click button to select folder containing HTML templates, system
          will automatically read all .html files recursively
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={templates}
        rowKey="fullPath"
        loading={fileLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} templates`,
        }}
      />

      {/* 预览模态框 */}
      {currentTemplate && (
        <PreviewModal
          visible={previewVisible}
          template={currentTemplate}
          onClose={() => setPreviewVisible(false)}
          onSend={handlePreviewToSend}
        />
      )}

      {/* 发送模态框 */}
      {currentTemplate && (
        <SendModal
          visible={sendVisible}
          template={currentTemplate}
          onClose={() => setSendVisible(false)}
          onSend={handleSend}
        />
      )}
    </div>
  );
};
