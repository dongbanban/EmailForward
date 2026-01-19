import React, { useState } from "react";
import { Modal, Form, Input, Button } from "antd";
import type { SendModalProps } from "@/types/components";

/**
 * 邮件发送弹窗组件
 */
export const SendModal: React.FC<SendModalProps> = ({
  visible,
  template,
  onClose,
  onSend,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSend(values.recipient);
    } catch (error) {
      console.error("Form validation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={`Send Email: ${template.fileName}`}
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
        >
          Send
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Recipient Email"
          name="recipient"
          rules={[
            {
              type: "email",
              message: "Please enter a valid email address",
            },
          ]}
        >
          <Input placeholder="Leave empty to use default recipient from config" />
        </Form.Item>

        <Form.Item label="Email Subject">
          <Input value={template.fileName} disabled />
        </Form.Item>

        <Form.Item label="Template Path">
          <Input value={template.relativePath} disabled />
        </Form.Item>
      </Form>
    </Modal>
  );
};
