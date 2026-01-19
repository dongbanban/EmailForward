/*
 * @file: /Users/i104/EmailForward/src/components/EmailManagement/PreviewModal.tsx
 * @author: dongyang
 */
import React from "react";
import { Modal, Button } from "antd";
import type { PreviewModalProps } from "@/types/components";
import useStyles from "./PreviewModal.style";

/**
 * 邮件预览弹窗组件
 */
export const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  template,
  onClose,
  onSend,
}) => {
  const styles = useStyles();

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
      <div css={styles.containerStyles}>
        {template.htmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: template.htmlContent }} />
        ) : (
          <p css={styles.noContentStyles}>No content</p>
        )}
      </div>
    </Modal>
  );
};
