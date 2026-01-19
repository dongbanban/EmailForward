/*
 * @file: /Users/i104/EmailForward/src/components/Menu/AppMenu.tsx
 * @author: dongyang
 */
import React from "react";
import { Menu } from "antd";
import { MailOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";

interface AppMenuProps {
  selectedKey: string;
  onSelect: (key: string) => void;
}

/**
 * 应用侧边栏菜单组件
 */
export const AppMenu: React.FC<AppMenuProps> = ({ selectedKey, onSelect }) => {
  const menuItems: MenuProps["items"] = [
    {
      key: "email-management",
      icon: <MailOutlined />,
      label: "Email Management",
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    onSelect(e.key);
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ height: "100%", borderRight: 0 }}
    />
  );
};
