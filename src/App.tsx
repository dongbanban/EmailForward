/*
 * @file: /Users/i104/EmailForward/src/App.tsx
 * @author: dongyang
 */
import { ConfigProvider } from "antd";
import { AppLayout } from "./components/Layout/AppLayout";
import { AppMenu } from "./components/Menu/AppMenu";
import { EmailManagement } from "./components/EmailManagement/EmailManagement";
import { useAppStore } from "./store/app.store";

/**
 * 应用主组件
 */
function App() {
  const { selectedMenu, setSelectedMenu } = useAppStore();

  // 根据选中的菜单渲染对应内容
  const renderContent = () => {
    switch (selectedMenu) {
      case "email-management":
        return <EmailManagement />;
      default:
        return <EmailManagement />;
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          // 重置全局 margin
        },
      }}
    >
      <AppLayout
        menu={<AppMenu selectedKey={selectedMenu} onSelect={setSelectedMenu} />}
      >
        {renderContent()}
      </AppLayout>
    </ConfigProvider>
  );
}

export default App;
