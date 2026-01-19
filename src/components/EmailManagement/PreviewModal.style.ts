/*
 * @file: /Users/i104/EmailForward/src/components/EmailManagement/PreviewModal.style.ts
 * @author: dongyang
 */

import { css } from "@emotion/react";

const useStyles = () => {
  const containerStyles = css`
    max-height: 60vh;
    overflow: auto;
    border: 1px solid #f0f0f0;
    padding: 16px;
    background: #fff;
  `;

  const noContentStyles = css`
    color: #999;
  `;

  return {
    containerStyles,
    noContentStyles,
  };
};

export default useStyles;
