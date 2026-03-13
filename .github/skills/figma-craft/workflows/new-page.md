# 新页面生成工作流

本文档定义如何根据 Figma 设计创建全新的页面文件。

---

## 项目变量说明

> **便于分享的变量化配置**  
> 本文档使用变量代替项目特定信息，分享时可一键替换

| 变量                           | 当前值                  | 说明              |
| ------------------------------ | ----------------------- | ----------------- |
| `{{PROJECT_NAME}}`             | `你的项目`              | 项目名称          |
| `{{PROJECT_COMPONENT_PREFIX}}` | `你的项目组件`          | 项目组件前缀      |
| `{{DESIGN_SYSTEM}}`            | `你的设计系统`          | 设计系统名称      |
| `{{DESIGN_PACKAGE}}`           | `你的设计系统 npm 包名` | 设计系统 npm 包名 |
| `{{MCP_PREFIX}}`               | `你的 MCP 工具调用前缀` | MCP 工具调用前缀  |

**使用说明**：分享文档前，使用查找替换功能将上述变量替换为目标项目的实际值即可。

---

## 目录

- [适用场景](#适用场景)
- [准备检查](#准备检查)
  - [前置条件](#前置条件)
  - [预检查清单](#预检查清单)
- [执行流程](#执行流程)
  - [第 1 步：获取 Figma 设计上下文](#第-1-步获取-figma-设计上下文)
  - [第 2 步：分析设计结构](#第-2-步分析设计结构)
  - [第 3 步：查找并复用现有组件](#第-3-步查找并复用现有组件)
  - [第 4 步：提取并匹配样式 Token](#第-4-步提取并匹配样式-token)
  - [第 5 步：生成页面代码](#第-5-步生成页面代码)
  - [第 6 步：TypeScript 类型检查](#第-6-步typescript-类型检查)
  - [第 7 步：创建文件并验证](#第-7-步创建文件并验证)
  - [第 8 步：注册路由（如需要）](#第-8-步注册路由如需要)
- [成功标准](#成功标准)
  - [核心标准](#核心标准)
  - [次要标准](#次要标准)
- [输出示例](#输出示例)
- [常见错误](#常见错误)
  - [错误 1：Figma 节点不是完整页面](#错误-1figma-节点不是完整页面)
  - [错误 2：设计过于复杂](#错误-2设计过于复杂)
  - [错误 3：Token 匹配率过低](#错误-3token-匹配率过低)
- [相关文档](#相关文档)

---

## 适用场景

- ✅ 完全新建的页面（文件不存在）
- ✅ Figma 设计包含完整的页面布局
- ✅ 需要生成独立的路由页面

---

## 准备检查

### 前置条件

```markdown
- [ ] 已解析 Figma URL（fileKey + nodeId）
- [ ] 已确认目标路径（如 src/pages/UserList/UserList.tsx）
- [ ] 目标文件不存在（或已决定覆盖）
- [ ] 已确认意图为"创建新页面"
```

### 预检查清单

```markdown
1. 路径检查
   - [ ] 路径符合项目规范（src/pages/{Name}/{Name}.tsx）
   - [ ] 目录结构合理（是否需要同时创建 .style.ts, .types.ts 等）

2. 权限检查
   - [ ] 有 Figma 文件访问权限
   - [ ] 有目标目录写入权限

3. 依赖检查
   - [ ] Figma MCP 工具可用
   - [ ] Neat Design MCP 工具可用
   - [ ] Token 系统可用
```

---

## 执行流程

### 第 1 步：获取 Figma 设计上下文

**调用**：

```typescript
mcp_figma_get_design_context({
  fileKey: "...",
  nodeId: "...",
});
```

**获取内容**：

- HTML 结构
- CSS 样式（包含 Token 引用）
- 节点元数据
- 截图 URL（如需要）

**验证**：

- ✅ 响应完整（检查 `isTruncated`）
- ✅ 包含必要的样式信息
- ✅ HTML 结构清晰

**详细规范**：参考 [Figma MCP 集成规范](../reference/figma-mcp-integration.md)

---

### 第 2 步：分析设计结构

**目标**：理解设计的层次结构和组件组成。

**分析要点**：

1. 识别主要布局（单栏/双栏/三栏）
2. 识别功能区域（Header, Content, Sidebar, Footer 等）
3. 提取组件清单（Button, Table, Form, Modal 等）
4. 识别交互元素（点击、输入、选择等）

**输出**：

```typescript
interface PageStructure {
  layout: "single" | "double" | "triple";
  sections: {
    name: string;
    role: "header" | "content" | "sidebar" | "footer";
    components: string[];
  }[];
  interactions: {
    type: "click" | "input" | "select" | "submit";
    target: string;
    handler: string;
  }[];
}
```

---

### 第 3 步：查找并复用现有组件

**目标**：最大化使用项目中已有的组件，避免重复创建。

**查找策略**：

1. 根据组件名称搜索（如 `Button`, `Table`, `SearchForm`）
2. 根据组件功能搜索（如"搜索框"、"数据表格"）
3. 查看类似页面的实现（如已有的列表页）

**调用 Neat Design MCP**：

```typescript
// 获取所有可用组件
mcp_neat - design - m_get_all_component_names();

// 获取组件文档
mcp_neat - design - m_get_component_document({ componentName: "Button" });

// 获取组件示例
mcp_neat -
  design -
  m_get_component_example({
    componentName: "Button",
    exampleId: "primary-button",
  });
```

**决策标准**：

```markdown
组件是否复用？
├─ 已有 100% 匹配的组件 → ✅ 直接使用
├─ 已有功能相似的组件 → ✅ 使用 + 传递 props 定制
├─ 已有 Neat Design 组件 → ✅ 优先使用
├─ 类似组件可简单改造 → ⚠️ 考虑扩展现有组件
└─ 完全不存在 → ⏸️ 标记为"需新建"，但先完成页面框架
```

---

### 第 4 步：提取并匹配样式 Token

**目标**：将 Figma 样式值映射到项目 Token。

**提取样式值**：
从 `designContext.styles` 提取 CSS 变量的 fallback 值：

```
var(--color-border, #d1d5d6) → #d1d5d6
var(--spacing-md, 16px) → 16px
```

**加载项目 Token**：

```typescript
const token = useToken(); // @derbysoft/neat-design
```

**智能匹配**：

- 颜色：精确匹配 HEX 值，或使用色差算法
- 尺寸：允许 ±2px 误差
- 间距：允许 ±4px 误差

**置信度分级**：

- ≥0.8：直接使用
- 0.5-0.8：使用但标记供审核
- <0.5：提示用户决策（使用最接近 Token / 临时硬编码）

**详细规范**：参考 [样式映射策略](../reference/style-mapping-strategy.md)

---

### 第 5 步：生成页面代码

**生成内容**：

#### 主文件（UserList.tsx）

```
- 导入语句（React, Neat Design 组件, Token, 类型）
- 接口定义（Props, State）
- 函数组件定义
  - Hooks (useState, useEffect, useCallback 等)
  - 事件处理函数
  - 渲染逻辑（使用 Token 的 Emotion 样式）
- 导出语句
```

#### 样式文件（UserList.style.ts，如需要）

```
- 使用 css from '@emotion/react'
- 所有样式基于 Token
- 响应式样式（如需要）
```

#### 类型文件（UserList.types.ts，如需要）

```
- Props 接口
- State 接口
- API 响应类型
- 业务数据类型
```

**关键原则**：

1. **100% 使用 Token**：颜色、尺寸、间距等都应从 `token` 对象获取
2. **响应式处理**：如设计包含多端适配，使用媒体查询或 `flex` 布局
3. **无障碍**：添加适当的 `aria-*` 属性和语义化标签
4. **类型安全**：所有 props、state、函数参数都有类型定义
5. **性能优化**：使用 `memo`、`useMemo`、`useCallback` 避免不必要的渲染

参考 [React 组件开发规范]（项目指令）

---

### 第 6 步：TypeScript 类型检查

**立即验证**：

```bash
# 或使用编辑器 API 获取
tsc --noEmit
```

**处理错误**：

- 自动修复常见问题（导入路径、类型定义）
- 提示人工处理复杂问题

**目标**：0 errors, 0 warnings

**详细规范**：参考 [错误处理与恢复策略](../reference/error-handling.md#类型-c代码生成错误)

---

### 第 7 步：创建文件并验证

**创建文件**：

```typescript
await createFile(targetPath, generatedCode);
// 如有样式/类型文件，同时创建
```

**最终验证**：

```markdown
1. 代码检查
   - [ ] TypeScript 无错误
   - [ ] ESLint 无错误（或仅非关键警告）
   - [ ] Prettier 格式正确

2. 功能检查
   - [ ] 文件可正常导入
   - [ ] 组件可正常渲染
   - [ ] Token 正常应用

3. 视觉检查
   - [ ] 对比 Figma 设计稿
   - [ ] 颜色、尺寸、间距是否一致
   - [ ] 布局是否符合预期
```

---

### 第 8 步：注册路由（如需要）

如果是需要路由的页面，询问用户是否需要自动添加路由配置。

**top-up 项目路由配置模式**：

1. **创建模块级路由配置文件**（`config.route.js`）：

```javascript
// src/modules/[ModuleName]/config.route.js
import { AsyncComponent } from "vivy-async-component";
// 如需权限控制，导入 UserOperations
// import UserOperations from 'statics/UserOperations';

/**
 * 返回 [ModuleName] 模块的 routes 配置
 * @param store
 * @returns {*}
 */
export default function configureRoutes(store) {
  return {
    path: "/:brandCode/app/module-name",
    component: AsyncComponent(
      () => import("./containers/[ComponentName]"),
      store,
      [],
    ),
    // 可选：添加权限控制
    // permissions: [UserOperations.PERMISSION_NAME]
  };
}
```

**关键要点**：

- AsyncComponent 从 `vivy-async-component` 导入（不是 `routes/AsyncComponent`）
- 函数统一命名为 `configureRoutes`，接收 `store` 参数
- 返回单个对象（不是数组）
- path 必须是完整路径：`/:brandCode/app/module-name`
- component 使用 `AsyncComponent(importFn, store, [])`

2. **注册到主路由配置**（`src/config.route.js`）：
   - 在文件顶部添加导入：`import configureXxxRoutes from 'modules/Xxx/config.route';`
   - 在 configureAppRoutes 的 routes 数组中添加：`configureXxxRoutes(store)`

**自动化流程**：

```
✅ 页面文件已创建：src/modules/UserList/index.tsx

是否需要添加路由配置？(y/n)

[如用户选择 y]
✅ 正在创建路由配置...
   1. 创建 src/modules/UserList/config.route.js
      - 导入 AsyncComponent from 'vivy-async-component'
      - 导出 configureRoutes(store) 函数
      - 返回路由对象（path + component）
   2. 更新 src/config.route.js
      - 添加导入：import configureUserListRoutes from 'modules/UserList/config.route';
      - 在 routes 数组中添加：configureUserListRoutes(store)

✅ 路由配置完成！
   路由路径：/:brandCode/app/user-list
   访问示例：http://localhost:3000/hmp/app/user-list
```

**手动配置提示**（如用户选择 n）：

```
⏸️ 跳过路由自动配置

如需手动添加，请参考以下步骤：

1. 创建 src/modules/UserList/config.route.js：
   import { AsyncComponent } from 'vivy-async-component';

   export default function configureRoutes(store) {
       return {
           path: '/:brandCode/app/user-list',
           component: AsyncComponent(() => import('./containers/UserList'), store, [])
       };
   }

2. 编辑 src/config.route.js：
   - 在顶部添加：import configureUserListRoutes from 'modules/UserList/config.route';
   - 在 configureAppRoutes 的 routes 数组中添加：configureUserListRoutes(store)

参考现有模块（如 Commission、DashboardOverView）的路由配置
```

**关键注意事项**：

- AsyncComponent 必须从 `vivy-async-component` 导入
- 函数统一命名为 `configureRoutes`（不是 configureXxxRoutes）
- 返回对象（不是数组），包含 path 和 component
- 路由路径格式：`/:brandCode/app/module-name`（小写短横线格式）
- AsyncComponent 接收三个参数：`(importFn, store, dependencies)`
- 路由配置函数必须接收并使用 `store` 参数

---

## ✅ 成功标准

页面生成成功需满足：

### 核心标准

- ✅ TypeScript 类型检查 0 错误
- ✅ ESLint 检查通过
- ✅ 视觉还原度 ≥95%
- ✅ Token 使用率 ≥90%

### 次要标准

- ✅ 组件复用率 ≥80%
- ✅ 响应式布局正确
- ✅ 交互功能完整
- ✅ 无障碍标准符合

**详细评判标准**：参考 [成功验收标准](../reference/success-criteria.md)

---

## 📊 输出示例

```
🎯 开始处理：创建新页面

第 1 步：获取 Figma 设计上下文
✅ 已获取设计上下文
   节点名称：User List Page
   尺寸：1440x900px
   包含 Token：是（23 个 CSS 变量）

第 2 步：分析设计结构
✅ 已分析页面结构
   布局：单栏布局
   区域：Header (1), Content (1)
   组件：15 个（Button x3, Table x1, SearchForm x1...）

第 3 步：查找现有组件
✅ 已查找项目组件
   复用：12/15 (80%)
   需新建：3 个（UserAvatar, StatusBadge, ActionMenu）

⚠️ 建议优先完成页面框架，稍后补充自定义组件

第 4 步：提取并匹配样式 Token
✅ 已匹配样式 Token
   颜色：18/20 (90%) - 2 个中置信度待审核
   尺寸：10/10 (100%)
   间距：12/12 (100%)

第 5 步：生成页面代码
✅ 已生成代码文件
   - src/pages/UserList/UserList.tsx (320 行)
   - src/pages/UserList/UserList.types.ts (45 行)

第 6 步：TypeScript 类型检查
✅ 类型检查通过
   Errors: 0
   Warnings: 0

第 7 步：验证生成结果
✅ 所有检查通过
   TypeScript: ✅
   ESLint: ✅ (0 errors, 1 warning - 已忽略)
   格式: ✅

第 8 步：路由配置提示
⏸️ 请添加路由配置（见上方提示）

---

✅ 页面生成成功！

文件位置：src/pages/UserList/UserList.tsx

下一步建议：
1. 预览页面：npm run dev，访问 /user-list
2. 对比设计：打开 Figma 与实际效果并排查看
3. 补充组件：创建 UserAvatar、StatusBadge、ActionMenu
4. 添加路由：更新 src/config.route.js

需要帮助？输入 "查看 UserAvatar 组件设计" 继续
```

---

## 🚫 常见错误

### 错误 1：Figma 节点不是完整页面

**症状**：获取的设计只是一个小组件，不是完整页面

**处理**：

```
⚠️ 检测到节点 "Button" 可能不是完整页面

建议操作：
A. 选择父级节点（Frame/Page）重新获取
B. 继续（将按组件处理，而非页面）

选择：A
请提供父级节点的 Figma URL：
```

### 错误 2：设计过于复杂

**症状**：页面包含大量组件（>50 个元素）

**处理**：

```
⚠️ 设计包含 68 个元素，较为复杂

建议分步处理：
1. 先生成页面框架（布局+主要区域）
2. 再逐个区域细化（Header、Sidebar、Content）

继续生成完整页面？[Y/N]
```

### 错误 3：Token 匹配率过低

**症状**：Token 匹配置信度低于 50%

**处理**：

```
❌ Token 匹配率过低：12/30 (40%)

可能原因：
1. 设计未使用 Design Token（全是硬编码值）
2. 项目 Token 系统与设计不匹配

建议操作：
A. 联系设计师应用 Token 后重新转换
B. 临时使用硬编码值（后续需优化）
C. 手动指定 Token 映射规则

选择：[A/B/C]
```

---

## 🔗 相关文档

- [意图识别](./intent-detection.md) - 如何路由到此工作流
- [新组件工作流](./new-component.md) - 补充自定义组件
- [Figma MCP 集成规范](../references/figma-mcp-integration.md) - API 调用细节
- [样式映射策略](../references/style-mapping-strategy.md) - Token 匹配算法
- [错误处理策略](../references/error-handling.md) - 异常情况处理
- [成功验收标准](../references/success-criteria.md) - 质量评估标准
