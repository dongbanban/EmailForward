/*
 * @file: /Users/i104/EmailForward/src/components/Layout/AppLayout.tsx
 * @author: dongyang
 */
import React from "react";
import { Layout } from "antd";
import type { AppLayoutProps } from "@/types/components";
import "./AppLayout.css";

const { Header, Sider, Content } = Layout;

/**
 * 应用主布局组件
 * 包含头部、侧边栏和内容区域
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children, menu }) => {
  return (
    <Layout className="app-layout">
      {/* 头部 */}
      <Header className="app-header">
        <div className="app-logo">Email Forward</div>
        <div className="app-header-right">{/* 预留未来使用 */}</div>
      </Header>

      <Layout>
        {/* 侧边栏 */}
        <Sider width={200} className="app-sider">
          {menu}
        </Sider>

        {/* 内容区域 */}
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  );
};
