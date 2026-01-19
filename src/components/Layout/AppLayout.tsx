/*
 * @file: /Users/i104/EmailForward/src/components/Layout/AppLayout.tsx
 * @author: dongyang
 */
import React from "react";
import { Layout } from "antd";
import type { AppLayoutProps } from "@/types/components";
import useStyles from "./AppLayout.style";

const { Header, Sider, Content } = Layout;

/**
 * 应用主布局组件
 * 包含头部、侧边栏和内容区域
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children, menu }) => {
  const styles = useStyles();

  return (
    <Layout css={styles.layoutStyles}>
      {/* 头部 */}
      <Header css={styles.headerStyles}>
        <div css={styles.logoStyles}>Email Forward</div>
        <div css={styles.headerRightStyles}>{/* 预留未来使用 */}</div>
      </Header>

      <Layout>
        {/* 侧边栏 */}
        <Sider width={200} css={styles.siderStyles}>
          {menu}
        </Sider>

        {/* 内容区域 */}
        <Content css={styles.contentStyles}>{children}</Content>
      </Layout>
    </Layout>
  );
};
