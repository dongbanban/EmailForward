/*
 * @file: /Users/i104/EmailForward/src/components/Layout/AppLayout.style.ts
 * @author: dongyang
 */

import { css } from "@emotion/react";

const useStyles = () => {
  const layoutStyles = css`
    height: 100vh;
    margin: 0 !important;
    overflow: hidden;
  `;

  const headerStyles = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    background: #fff;
    color: #000;
    border-bottom: 1px solid #f0f0f0;
  `;

  const logoStyles = css`
    font-size: 20px;
    font-weight: 600;
  `;

  const headerRightStyles = css`
    display: flex;
    align-items: center;
    gap: 16px;
  `;

  const siderStyles = css`
    background: #fff;
    border-right: 1px solid #f0f0f0;
  `;

  const contentStyles = css`
    padding: 24px;
    overflow-y: auto;
    background: #f5f5f5;
  `;

  return {
    layoutStyles,
    headerStyles,
    logoStyles,
    headerRightStyles,
    siderStyles,
    contentStyles,
  };
};

export default useStyles;
