---
name: figma-craft
description: |
  Figma 设计稿到 React 代码的智能转换工具。自动适配项目规范，智能匹配 Design Tokens，生成符合 {{PROJECT_NAME}} 项目标准的代码。
  
  核心能力：
  - 智能样式映射：自动将 Figma 样式值匹配到项目 Token 系统
  - 组件智能选择：自动选用项目中的 {{DESIGN_SYSTEM}} 和 {{PROJECT_COMPONENT_PREFIX}} 组件
  - 代码风格一致：参考现有代码，保持团队风格统一
  - 渐进式确认：关键决策点与用户确认，避免误操作
  
  触发场景：处理 Figma 设计稿、生成/修改页面或组件、从设计生成代码、设计转代码、Figma URL
---

## 项目变量说明

> **便于分享的变量化配置**  
> 本文档使用变量代替项目特定信息，分享时可一键替换

| 变量 | 当前值 | 说明 |
|------|--------|------|
| `{{PROJECT_NAME}}` | `你的项目` | 项目名称 |
| `{{PROJECT_COMPONENT_PREFIX}}` | `你的项目组件` | 项目组件前缀 |
| `{{DESIGN_SYSTEM}}` | `你的设计系统` | 设计系统名称 |
| `{{DESIGN_PACKAGE}}` | `你的设计系统 npm 包名` | 设计系统 npm 包名 |
| `{{MCP_PREFIX}}` | `你的 MCP 工具调用前缀` | MCP 工具调用前缀 |

**使用说明**：分享文档前，使用查找替换功能将上述变量替换为目标项目的实际值即可。

---

# Figma Craft

**智能将 Figma 设计转换为符合项目规范的 React 代码**

> 📖 **核心理念**  
> 不是简单的"设计转代码"，而是**理解设计意图 → 智能适配项目 → 生成工程级代码**

---

## 核心原则

### 1. 设计意图优先
Figma MCP 输出的 React + Tailwind 代码仅作为**设计表示**，不是最终代码。重点是理解设计意图，而非照搬生成的代码。

### 2. 项目规范至上
所有生成的代码必须：
- 使用项目的 Design Token 系统（不用硬编码值或 Tailwind 类）
- 复用现有的 {{PROJECT_COMPONENT_PREFIX}} 包装组件（不重复造轮）
- 遵循团队代码风格（参考类似模块）
- 通过 TypeScript 类型检查（零错误）

### 3. 智能而非机械
- **样式匹配**：精确匹配 + 近似匹配 + 置信度评分
- **组件选择**：根据设计特征智能选择最合适的组件
- **代码生成**：理解上下文，生成符合场景的代码

### 4. 渐进式确认
在关键决策点与用户确认：
- 工作模式识别
- 文件路径确定
- 生成代码预览
- 路由配置决策

---

## 执行流程

### 第 1 步：意图识别

**目标**：理解用户需求，确定工作模式

**输入识别**：
- Figma URL（完整文件或特定节点）
- 目标位置（新建或现有文件路径）
- 操作类型（生成/修改/重构）

**工作模式判断**：

| 输入特征 | 工作模式 |
|---------|---------|
| 新文件 + "页面" | 新页面生成 |
| 新文件 + "组件" | 新组件生成 |
| 现有文件 + "修改" | 文件局部修改 |
| 现有文件 + "重构" | 文件完全重构 |

**输出**：向用户展示识别结果，等待确认

📄 详细流程：[workflows/intent-detection.md](./workflows/intent-detection.md)

---

### 第 2 步：获取设计数据

**目标**：调用 Figma MCP 获取完整设计信息

**核心操作**：
1. 调用 `mcp_figma_get_design_context` 获取设计上下文
2. 如响应过大，调用 `mcp_figma_get_metadata` 后分步获取
3. 获取设计截图作为视觉参考（可选）

**关键规范**：
- 必须遵循 [Figma MCP 集成规范](./references/figma-mcp-integration.md)
- 始终先尝试 `get_design_context`，不跳步
- 检查响应完整性，必要时切换分步模式

---

### 第 3 步：智能样式映射

**目标**：将 Figma 样式值映射到项目 Token

**映射策略**：
- **颜色**：精确匹配（HEX/RGB 转换后比对）
- **尺寸**：近似匹配（允许合理误差）
- **间距**：寻找最接近的 Token
- **字体**：匹配字号和字重

**置信度处理**：
- 高置信度（≥0.8）：直接使用
- 中置信度（0.5-0.8）：标记供审核
- 低置信度（<0.5）：提示人工决策

📄 详细策略：[references/style-mapping-strategy.md](./references/style-mapping-strategy.md)

---

### 第 4 步：组件文档查询

**目标**：获取 {{DESIGN_SYSTEM}} 组件使用指南

**调用工具**：
```
{{MCP_PREFIX}}_get_figma_to_code_guide()
{{MCP_PREFIX}}_get_all_component_names()
{{MCP_PREFIX}}_get_use_create_styles_guide()
{{MCP_PREFIX}}_get_component_document(componentName)
```

**输出**：组件 API、使用示例、样式指南

---

### 第 5 步：参考现有代码

**目标**：确保生成代码与项目风格一致

**查找内容**：
- {{PROJECT_COMPONENT_PREFIX}} 包装组件（`src/components/{{PROJECT_COMPONENT_PREFIX}}/*`）
- 类似模块实现（搜索相似的 imports 和结构）
- 路由配置模式（查看现有路由文件）

**学习要点**：
- 文件组织结构
- 组件使用方式
- 样式定义模式
- 类型定义规范

---

### 第 6 步：生成代码

**目标**：生成符合项目规范的高质量代码

**生成内容**：
- **主文件**（index.tsx）：组件逻辑和结构
- **样式文件**（index.style.ts）：使用 useCreateStyles + Token
- **类型文件**（index.types.ts）：TypeScript 类型定义
- **路由配置**（config.route.js）：使用 vivy-async-component，返回路由对象

**代码质量要求**：
1. 使用项目 Token，不硬编码
2. 复用 {{PROJECT_COMPONENT_PREFIX}} 组件，不重复实现
3. 添加必要注释，解释关键逻辑
4. 完整类型定义，无 `any` 类型
5. 遵循团队命名规范

---

### 第 7 步：验证与修复

**TypeScript 检查**：
- 运行 `get_errors` 检查所有生成的文件
- 如有错误，分析原因并修复
- 重复检查直到零错误

**路由配置**（如适用）：
- 询问用户是否需要添加路由
- 创建 `config.route.js`：导出 `configureRoutes(store)` 函数，返回 `{ path, component }` 对象
- 使用 `AsyncComponent` from `vivy-async-component`
- 更新 `src/config.route.js`：添加导入和在 routes 数组中调用
- 告知访问路径（`/:brandCode/app/module-name`）

**视觉验证**（推荐）：
- 对比 Figma 截图
- 检查布局、间距、颜色
- 确认交互行为

📄 验收标准：[references/success-criteria.md](./references/success-criteria.md)

---

## 📋 工作模式详解

### 新页面生成
在 `src/modules/[PageName]` 创建完整页面结构，包含主文件、样式、类型、子组件和路由配置。

📄 详细流程：[workflows/new-page.md](./workflows/new-page.md)

### 新组件生成
创建独立可复用组件，包含 .tsx、.style.ts、.types.ts 文件和使用文档。

📄 详细流程：[workflows/new-component.md](./workflows/new-component.md)

### 文件修改
在现有文件中局部集成 Figma 设计，保持原有逻辑不变。

📄 详细流程：[workflows/modify-file.md](./workflows/modify-file.md)

### 文件重构
完全重写组件实现，保持公共 API 接口不变，自动创建备份。

📄 详细流程：[workflows/refactor-file.md](./workflows/refactor-file.md)

---

## ⚠️ 错误处理

遇到问题时：
1. 清晰告知用户发生了什么
2. 提供可能的原因分析
3. 给出 2-3 个解决方案选项
4. 等待用户选择后执行

常见错误及处理：
- **MCP 调用失败** → 重试或降级方案
- **Token 匹配失败** → 标记人工审核或使用最接近值
- **TypeScript 错误** → 分析并自动修复
- **文件冲突** → 询问覆盖/重命名/取消

📄 完整指南：[references/error-handling.md](./references/error-handling.md)

---

## ✅ 正确使用示例

```
用户：@figma-craft 根据这个 figma 生成新页面 testpage
     https://figma.com/design/xxx?node-id=5005-115094

AI 执行：
✅ 识别：新页面生成，目标 src/modules/testpage
✅ 确认：展示识别结果，用户确认
✅ 获取：调用 Figma MCP 获取设计数据
✅ 映射：提取样式值，匹配项目 Token（95% 匹配率）
✅ 查询：获取 {{DESIGN_SYSTEM}} 组件文档
✅ 参考：找到类似模块 src/modules/Dashboard
✅ 生成：创建 5 个文件（主文件、样式、类型、路由配置）
✅ 路由：注册到 src/config.route.js，访问路径 /:brandCode/app/testpage
✅ 验证：TypeScript 检查通过，0 错误
✅ 完成：列出生成的文件，提供使用说明
```

---

## 🚫 禁止行为

1. ❌ 跳过用户确认，直接假设工作模式
2. ❌ 硬编码样式值，不使用项目 Token
3. ❌ 重复实现已有组件，不复用 {{PROJECT_COMPONENT_PREFIX}} 组件
4. ❌ 生成代码后不执行类型检查
5. ❌ 修改现有文件不创建备份
6. ❌ 忽略项目代码风格，按自己偏好生成

---

## 📚 参考文档

### 核心规范
- [Figma MCP 集成规范](./references/figma-mcp-integration.md) - MCP 调用流程和规则
- [样式映射策略](./references/style-mapping-strategy.md) - Token 智能匹配算法
- [成功验收标准](./references/success-criteria.md) - 代码质量检查清单
- [错误处理指南](./references/error-handling.md) - 异常情况处理方案

### 工作流程
- [意图识别](./workflows/intent-detection.md) - 解析用户需求
- [新页面生成](./workflows/new-page.md) - 完整页面创建流程
- [新组件生成](./workflows/new-component.md) - 独立组件创建流程
- [文件修改](./workflows/modify-file.md) - 局部修改现有文件
- [文件重构](./workflows/refactor-file.md) - 完全重写组件

---

**设计理念**：让 AI 成为理解设计、适配项目、生成工程级代码的智能助手，而非简单的代码生成器。
