/*
 * @file: /Users/i104/EmailForward/src/components/EmailManagement/EmailManagement.style.ts
 * @author: dongyang
 */

import { css } from "@emotion/react";

const useStyles = () => {
  const containerStyles = css`
    width: 100%;
  `;

  const actionBarStyles = css`
    margin-bottom: 16px;
  `;

  const hintTextStyles = css`
    margin-top: 8px;
    color: #666;
    font-size: 12px;
  `;

  return {
    containerStyles,
    actionBarStyles,
    hintTextStyles,
  };
};

export default useStyles;
