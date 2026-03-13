# 新组件生成工作流

本文档定义如何根据 Figma 设计创建独立的 React 组件。

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
  - [组件分类决策](#组件分类决策)
- [执行流程](#执行流程)
  - [第 1 步：获取 Figma 组件设计](#第-1-步获取-figma-组件设计)
  - [第 2 步：分析组件特性](#第-2-步分析组件特性)
  - [第 3 步：设计组件 API](#第-3-步设计组件-api)
  - [第 4 步：查找依赖组件](#第-4-步查找依赖组件)
  - [第 5 步：提取并匹配样式 Token](#第-5-步提取并匹配样式-token)
  - [第 6 步：生成组件代码](#第-6-步生成组件代码)
  - [第 7 步：编写组件文档（JSDoc）](#第-7-步编写组件文档jsdoc)
  - [第 8 步：TypeScript 类型检查](#第-8-步typescript-类型检查)
  - [第 9 步：创建文件并验证](#第-9-步创建文件并验证)
  - [第 10 步：创建示例文件（可选）](#第-10-步创建示例文件可选)
- [成功标准](#成功标准)
  - [核心标准](#核心标准)
  - [次要标准](#次要标准)
- [输出示例](#输出示例)
- [常见错误](#常见错误)
  - [错误 1：组件过于庞大](#错误-1组件过于庞大)
  - [错误 2：组件职责不清](#错误-2组件职责不清)
  - [错误 3：Props 过多](#错误-3props-过多)
- [相关文档](#相关文档)

---

## 适用场景

- ✅ 创建可复用的业务组件
- ✅ 提取页面中的通用模块为组件
- ✅ 实现设计系统中的新组件
- ✅ Figma 设计是一个独立的组件或模块

---

## 准备检查

### 前置条件

```markdown
- [ ] 已解析 Figma URL（fileKey + nodeId）
- [ ] 已确认目标路径（如 src/components/SearchForm/SearchForm.tsx）
- [ ] 目标文件不存在（或已决定覆盖）
- [ ] 已确认意图为"创建新组件"
```

### 组件分类决策

```markdown
业务组件（src/components/{Name}/）：

- 包含特定业务逻辑
- 依赖业务数据类型
- 较少在不同项目间复用
- 示例：UserTable, OrderForm, DashboardCard

通用组件（src/components/common/{Name}.tsx）：

- 纯 UI 组件，无业务逻辑
- 高度可复用
- 不依赖特定数据结构
- 示例：IconButton, StatusBadge, Tooltip

优先使用 Neat Design：

- 如果 Neat Design 已有类似组件，优先使用而非新建
```

---

## 执行流程

### 第 1 步：获取 Figma 组件设计

**调用**：

```typescript
mcp_figma_get_design_context({
  fileKey: "...",
  nodeId: "...",
});
```

**验证**：

- ✅ 节点是独立组件（而非整个页面）
- ✅ 设计包含必要的状态（默认、hover、disabled 等）
- ✅ 样式信息完整

**如果节点过大**：

```
⚠️ 节点包含 45 个子元素，可能是页面而非组件

建议操作：
A. 确认这确实是一个组件（继续）
B. 选择更小的子节点作为组件
C. 改为创建页面（new-page 工作流）

选择：[A/B/C]
```

**详细规范**：参考 [Figma MCP 集成规范](../reference/figma-mcp-integration.md)

---

### 第 2 步：分析组件特性

**目标**：确定组件的类型、用途和 API 设计。

**分析维度**：

#### A. 组件类型

```typescript
type ComponentType =
  | "display" // 纯展示（如 Card, Badge）
  | "input" // 输入控件（如 Input, Select）
  | "interactive" // 交互元素（如 Button, Link）
  | "layout" // 布局组件（如 Grid, Stack）
  | "composite"; // 复合组件（如 Form, Table）
```

#### B. 状态变体

```markdown
- [ ] 默认状态（default）
- [ ] 悬停状态（hover）
- [ ] 激活状态（active）
- [ ] 禁用状态（disabled）
- [ ] 加载状态（loading）
- [ ] 错误状态（error）
```

#### C. 尺寸变体

```markdown
- [ ] small
- [ ] medium (默认)
- [ ] large
```

#### D. 主题变体

```markdown
- [ ] primary
- [ ] secondary
- [ ] success
- [ ] warning
- [ ] danger
```

---

### 第 3 步：设计组件 API

**目标**：定义清晰、符合 React 惯例的 Props 接口。

**API 设计原则**：

1. **明确必需/可选**

   ```typescript
   interface SearchFormProps {
     onSearch: (query: string) => void; // 必需
     placeholder?: string; // 可选
     initialValue?: string; // 可选
   }
   ```

2. **使用标准命名**
   - 事件处理：`onXxx`（如 `onClick`, `onChange`）
   - 布尔属性：`isXxx`（如 `isDisabled`, `isLoading`）
   - 数据传递：`value`, `data`, `items`

3. **支持样式定制**

   ```typescript
   interface Props {
     className?: string; // CSS 类名
     style?: React.CSSProperties; // 内联样式
     css?: SerializedStyles; // Emotion 样式
   }
   ```

4. **保持向后兼容**
   - 新增 prop 应是可选的
   - 避免破坏性修改

**参考 Neat Design API**：

```typescript
// 查看类似组件的 API 设计
mcp_neat - design - m_get_component_document({ componentName: "Button" });
```

---

### 第 4 步：查找依赖组件

**目标**：识别组件内部使用的子组件。

**查找策略**：

1. **从 Figma 设计识别**

   ```markdown
   设计包含：

   - 输入框 → 使用 <Input /> from Neat Design
   - 按钮 → 使用 <Button /> from Neat Design
   - 图标 → 使用 <Icon /> from Neat Design
   ```

2. **查询 Neat Design 组件库**

   ```typescript
   // 获取所有可用组件
   mcp_neat - design - m_get_all_component_names();

   // 查看组件详情
   mcp_neat - design - m_get_component_document({ componentName: "Input" });
   ```

3. **搜索项目现有组件**
   ```typescript
   // 搜索 src/components/ 下类似组件
   searchFiles("src/components/**/*.tsx");
   ```

**决策**：

```markdown
子组件是否可复用？
├─ Neat Design 有 → ✅ 优先使用
├─ 项目中已存在 → ✅ 直接引用
├─ 需要定制 → ⚠️ 扩展 Neat Design 组件
└─ 完全自定义 → ⏸️ 标记为"需创建子组件"
```

---

### 第 5 步：提取并匹配样式 Token

**同新页面工作流**，参考：

- [新页面工作流 - 第 4 步](./new-page.md#第-4-步提取并匹配样式-token)
- [样式映射策略](../reference/style-mapping-strategy.md)

**组件特有注意点**：

1. **支持主题变体**

   ```typescript
   const getVariantStyles = (variant: Variant) => {
     switch (variant) {
       case 'primary': return { bg: token['color-bg-primary'], ... };
       case 'secondary': return { bg: token['color-bg-secondary'], ... };
       ...
     }
   };
   ```

2. **响应状态变化**
   ```typescript
   const styles = {
     default: { color: token["color-text"] },
     hover: { color: token["color-text-hover"] },
     disabled: { color: token["color-text-disabled"] },
   };
   ```

---

### 第 6 步：生成组件代码

**生成内容**：

#### 主文件（SearchForm.tsx）

```
1. 导入语句
   - React, Neat Design 组件, Token
   - 类型定义
   - 子组件（如有）

2. 接口定义
   - Props 接口（导出）
   - 内部 State 类型

3. 组件实现
   - Hooks (useState, useCallback, useMemo)
   - 事件处理函数
   - 样式定义（基于 Token）
   - 渲染逻辑

4. 导出
   - 默认导出组件（可能用 memo 包装）
   - 命名导出类型
```

#### 类型文件（SearchForm.types.ts，可选）

```
- Props 接口
- 回调函数类型
- 组件特有数据类型
```

#### 样式文件（SearchForm.style.ts，可选）

```
- 复杂样式逻辑
- 多变体样式
- 响应式样式
```

**关键要点**：

1. **性能优化**

   ```typescript
   // 使用 memo 避免不必要的重渲染
   export default memo(SearchForm);

   // 使用 useCallback 稳定回调引用
   const handleChange = useCallback((e) => { ... }, [deps]);

   // 使用 useMemo 缓存计算结果
   const computedValue = useMemo(() => { ... }, [deps]);
   ```

2. **可访问性**

   ```typescript
   <button
     aria-label="搜索"
     aria-disabled={isDisabled}
     role="button"
   >
   ```

3. **类型安全**

   ```typescript
   // 所有 props 都应有类型
   interface SearchFormProps { ... }

   // 泛型支持（如适用）
   interface TableProps<T> { data: T[]; ... }
   ```

---

### 第 7 步：编写组件文档（JSDoc）

**在组件顶部添加文档注释**：

````typescript
/**
 * 搜索表单组件
 *
 * @description
 * 提供搜索输入框和搜索按钮，支持防抖和实时搜索。
 *
 * @example
 * ```tsx
 * <SearchForm
 *   onSearch={(query) => console.log(query)}
 *   placeholder="请输入关键词"
 * />
 * ```
 *
 * @param {SearchFormProps} props - 组件属性
 * @returns {JSX.Element}
 */
export default function SearchForm(props: SearchFormProps) { ... }
````

---

### 第 8 步：TypeScript 类型检查

**同新页面工作流**，参考：

- [新页面工作流 - 第 6 步](./new-page.md#第-6-步typescript-类型检查)
- [错误处理策略 - 类型错误](../reference/error-handling.md#c1typescript-类型错误)

---

### 第 9 步：创建文件并验证

**创建文件**：

```typescript
await createFile(targetPath, generatedCode);
```

**验证清单**：

```markdown
1. 代码质量
   - [ ] TypeScript 无错误
   - [ ] ESLint 无错误
   - [ ] 格式正确（Prettier）

2. 组件 API
   - [ ] Props 接口清晰
   - [ ] 必需/可选标注正确
   - [ ] 事件回调命名规范

3. 样式
   - [ ] 100% 使用 Token
   - [ ] 支持变体（如有）
   - [ ] 支持状态（如有）

4. 可复用性
   - [ ] 无硬编码业务逻辑
   - [ ] Props 设计灵活
   - [ ] 可独立运行
```

---

### 第 10 步：创建示例文件（可选）

**如果是通用组件，可创建示例文件帮助其他开发者使用**：

```typescript
// SearchForm.example.tsx
import SearchForm from './SearchForm';

export default function SearchFormExample() {
  const handleSearch = (query: string) => {
    console.log('搜索:', query);
  };

  return (
    <div>
      <h3>基础用法</h3>
      <SearchForm onSearch={handleSearch} />

      <h3>带初始值</h3>
      <SearchForm
        onSearch={handleSearch}
        initialValue="关键词"
      />

      <h3>禁用状态</h3>
      <SearchForm
        onSearch={handleSearch}
        isDisabled
      />
    </div>
  );
}
```

**提示用户**：

```
✅ 组件已创建：src/components/SearchForm/SearchForm.tsx

📖 可选：创建示例文件？
示例文件可帮助其他开发者了解组件用法

[Y] 是，创建 SearchForm.example.tsx
[N] 否，跳过

选择：
```

---

## ✅ 成功标准

组件生成成功需满足：

### 核心标准

- ✅ TypeScript 类型检查 0 错误
- ✅ ESLint 检查通过
- ✅ 视觉还原度 ≥95%
- ✅ Props API 清晰合理

### 次要标准

- ✅ Token 使用率 = 100%（组件应严格遵守）
- ✅ 支持必要的变体和状态
- ✅ 性能优化（memo/useMemo/useCallback）
- ✅ 可访问性标准符合

**详细评判标准**：参考 [成功验收标准](../reference/success-criteria.md)

---

## 📊 输出示例

````
🎯 开始处理：创建新组件

第 1 步：获取 Figma 组件设计
✅ 已获取设计
   组件名称：Search Form
   尺寸：400x60px
   包含变体：default, focus, error (3 个状态)

第 2 步：分析组件特性
✅ 已分析组件特性
   类型：复合组件（input + button）
   状态变体：default, focus, error, disabled
   尺寸变体：medium（单一尺寸）

第 3 步：设计组件 API
✅ 已设计 Props 接口
   interface SearchFormProps {
     onSearch: (query: string) => void;  // 必需
     placeholder?: string;
     initialValue?: string;
     isDisabled?: boolean;
     onError?: (message: string) => void;
   }

第 4 步：查找依赖组件
✅ 已查找依赖
   子组件：
   - Input (Neat Design) ✅
   - Button (Neat Design) ✅
   复用率：100%

第 5 步：提取并匹配样式 Token
✅ Token 匹配完成
   颜色：8/8 (100%)
   尺寸：4/4 (100%)
   间距：6/6 (100%)

第 6 步：生成组件代码
✅ 已生成代码
   - src/components/SearchForm/SearchForm.tsx (180 行)
   - src/components/SearchForm/SearchForm.types.ts (25 行)

第 7 步：编写组件文档
✅ 已添加 JSDoc 文档

第 8 步：TypeScript 类型检查
✅ 类型检查通过
   Errors: 0, Warnings: 0

第 9 步：验证生成结果
✅ 所有检查通过
   TypeScript: ✅
   ESLint: ✅
   Props API: ✅
   Token 使用: 100%

第 10 步：示例文件
⏸️ 是否创建 SearchForm.example.tsx？[Y/N]

---

✅ 组件生成成功！

文件位置：src/components/SearchForm/SearchForm.tsx

组件使用示例：
```tsx
import SearchForm from '@/components/SearchForm/SearchForm';

<SearchForm
  onSearch={(query) => console.log(query)}
  placeholder="搜索用户..."
/>
````

下一步建议：

1. 在页面中使用组件测试效果
2. 对比 Figma 设计检查视觉还原度
3. 测试各种状态（focus, error, disabled）
4. 如需更多变体，请提供相应 Figma 设计

```

---

## 🚫 常见错误

### 错误 1：组件过于庞大

**症状**：生成的组件文件 >500 行

**处理**：
```

⚠️ 组件代码较长（520 行），建议拆分

建议：
A. 拆分为多个子组件
B. 提取复杂逻辑到 Hooks
C. 继续（保持当前结构）

选择：A

分析中...
建议拆分为：

1. SearchInput (输入框逻辑)
2. SearchButton (按钮逻辑)
3. SearchForm (组合 + 协调)

开始拆分？[Y/N]

```

### 错误 2：组件职责不清

**症状**：组件既有 UI 又有复杂业务逻辑

**处理**：
```

⚠️ 组件包含 API 调用和数据处理逻辑

建议：
A. 拆分为 UI 组件 + 自定义 Hook

- SearchForm (UI 展示)
- useSearch (数据逻辑)
  B. 保持当前结构（可能影响复用性）

推荐：A

开始拆分？[Y/N]

```

### 错误 3：Props 过多

**症状**：Props 接口超过 15 个属性

**处理**：
```

⚠️ Props 接口包含 18 个属性，较为复杂

建议：
A. 合并相关属性为对象
Before: { color, size, weight, family }
After: { font: FontConfig }

B. 使用变体（variants）减少 props
Before: { isPrimary, isSecondary, isDanger }
After: { variant: 'primary' | 'secondary' | 'danger' }

C. 保持当前结构

选择：[A/B/C]

```

---

## 🔗 相关文档

- [意图识别](./intent-detection.md) - 如何路由到此工作流
- [新页面工作流](./new-page.md) - 在页面中使用组件
- [Figma MCP 集成规范](../references/figma-mcp-integration.md) - API 调用细节
- [样式映射策略](../references/style-mapping-strategy.md) - Token 匹配算法
- [错误处理策略](../references/error-handling.md) - 异常情况处理
- [成功验收标准](../references/success-criteria.md) - 质量评估标准
```
