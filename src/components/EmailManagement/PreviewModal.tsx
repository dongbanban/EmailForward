/*
 * @file: /Users/i104/EmailForward/src/components/EmailManagement/PreviewModal.tsx
 * @author: dongyang
 */
import React from "react";
import { Modal, Button } from "antd";
import type { PreviewModalProps } from "@/types/components";
import "./PreviewModal.css";

/**
 * 邮件预览弹窗组件
 */
export const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  template,
  onClose,
  onSend,
}) => {
  return (
    <Modal
      title={`Preview: ${template.fileName}`}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button key="send" type="primary" onClick={onSend}>
          Send
        </Button>,
      ]}
    >
      <div className="preview-modal-container">
        {template.htmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: template.htmlContent }} />
        ) : (
          <p className="preview-modal-no-content">No content</p>
        )}
      </div>
    </Modal>
  );
};
