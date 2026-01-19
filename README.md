# Email Forward - 邮件转发平台

基于 Vite + Express 的邮件管理和转发系统，支持通过浏览器加载本地模板并发送邮件。

## 项目简介

Email Forward 是一个简洁的邮件管理平台，允许用户通过浏览器文件选择器加载本地邮件模板，并通过后端服务发送邮件。项目采用前后端一体化架构，通过 Vite 插件实现开发时的后端 API 服务。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI 组件库**: Ant Design v5
- **状态管理**: Zustand
- **后端服务**: Express (集成在 Vite 插件中)
- **邮件发送**: Nodemailer

## 核心特性

- ✅ 无需登录，开箱即用
- ✅ 经典的顶部导航栏 + 侧边栏布局
- ✅ 支持通过文件选择器递归加载本地 HTML 模板
- ✅ 自动加载默认配置路径的模板
- ✅ 单个或批量发送邮件
- ✅ 实时预览邮件内容
- ✅ 自定义收件人或使用默认配置
- ✅ 前后端一体化架构
- ✅ 完整的 TypeScript 类型支持

## 项目结构

```
EmailForward/
├── src/
│   ├── components/          # React 组件
│   │   ├── Layout/          # 布局组件
│   │   │   ├── AppLayout.tsx
│   │   │   └── AppLayout.css
│   │   ├── Menu/            # 菜单组件
│   │   │   └── AppMenu.tsx
│   │   └── EmailManagement/ # 邮件管理组件
│   │       ├── EmailManagement.tsx
│   │       ├── EmailManagement.css
│   │       ├── PreviewModal.tsx
│   │       ├── PreviewModal.css
│   │       └── SendModal.tsx
│   ├── config/              # 配置文件
│   │   └── email.config.ts  # 邮件配置
│   ├── services/            # 服务层
│   │   ├── email.service.ts     # 邮件服务（调用后端 API）
│   │   └── template.service.ts  # 模板服务（文件选择器）
│   ├── store/               # Zustand 状态管理
│   │   ├── app.store.ts
│   │   └── emailTemplate.store.ts
│   ├── types/               # TypeScript 类型定义
│   │   ├── email.ts
│   │   ├── app.ts
│   │   ├── components.ts
│   │   └── store.ts
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式
├── server/                  # 后端服务
│   └── vite-email-plugin.js # Vite 邮件插件（Express API）
├── index.html               # HTML 入口文件
├── package.json             # 项目依赖
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts           # Vite 配置
└── README.md                # 项目文档
```

## 安装依赖

```bash
npm install
```

## 配置说明

在开始使用之前，请修改 `src/config/email.config.ts` 文件中的配置：

```typescript
export const emailConfig: EmailConfig = {
  smtp: {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "your-email@gmail.com", // 替换为您的 Gmail 邮箱
      pass: "your-app-password", // 替换为应用专用密码
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  },
  from: {
    name: "Email Forward",
    email: "your-email@gmail.com",
  },
  recipients: ["recipient@example.com"], // 默认收件人
  defaultTemplatePath: "", // 默认模板路径（自动加载）
};
```

### Gmail 应用专用密码设置

1. 登录您的 Google 账户
2. 前往 [https://myaccount.google.com/security](https://myaccount.google.com/security)
3. 启用两步验证（如果尚未启用）
4. 在"两步验证"下方找到"应用专用密码"
5. 生成一个新的应用专用密码
6. 将生成的密码复制到配置文件中

## 启动项目

```bash
npm run dev
```

项目将在 `http://localhost:3000` 启动。

## 使用说明

1. **加载模板**：点击"Select Template"按钮，选择包含 HTML 模板的文件夹
2. **预览模板**：点击表格中的"View"按钮查看邮件内容
3. **发送单个邮件**：点击"Send"按钮，可指定收件人或使用默认收件人
4. **批量发送**：点击"Send All"按钮，批量发送所有已加载的模板

## 构建生产版本

```bash
npm run build
```

## 预览生产版本

```bash
npm run preview
```

## 注意事项

1. 请确保 SMTP 配置正确，特别是 Gmail 的应用专用密码
2. 默认模板路径配置为空，如需自动加载，请设置有效的本地路径
3. 批量发送时会有延迟，避免触发邮件服务商的频率限制
4. 建议在测试环境中先发送测试邮件，确认配置正确后再使用
