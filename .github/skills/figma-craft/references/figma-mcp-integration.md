# Figma MCP 集成规范

本文档定义了如何正确使用 Figma MCP 工具获取设计数据。

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

## 必须遵循的调用流程

### 1. 始终先调用 `get_design_context`

```typescript
const designContext = await mcp_figma_get_design_context({
  fileKey,
  nodeId,
  clientFrameworks: "react",
  clientLanguages: "typescript",
});
```

**不要**直接调用 `get_metadata`，除非 `get_design_context` 响应被截断。

---

### 2. 检查响应完整性

```typescript
if (isResponseTruncated(designContext) || designContext.length > MAX_SIZE) {
  // 切换到分步模式
  await handleLargeResponse(fileKey, nodeId);
}
```

**判断标准**：

- 响应被截断（查看是否有 `...` 或 `truncated` 标记）
- 响应超过 100KB
- 包含不完整的 JSON 结构

---

### 3. 处理大型响应（分步获取）

当响应过大时：

**步骤 1**：获取节点地图

```typescript
const metadata = await mcp_figma_get_metadata({
  fileKey,
  nodeId,
});
```

**步骤 2**：识别关键节点
从 metadata 中识别需要的目标节点（通常是顶层容器和关键子节点）。

**步骤 3**：逐个获取节点设计数据

```typescript
for (const node of targetNodes) {
  const context = await mcp_figma_get_design_context({
    fileKey,
    nodeId: node.id,
    clientFrameworks: "react",
    clientLanguages: "typescript",
  });
  contexts.push(context);
}
```

**步骤 4**：合并所有上下文
将多个节点的设计数据合并成完整的设计上下文。

---

### 4. 获取视觉参考（可选但推荐）

```typescript
const screenshot = await mcp_figma_get_screenshot({
  fileKey,
  nodeId,
});
```

**用途**：

- 视觉验证生成的代码是否符合设计
- 理解设计师的布局意图
- 处理复杂交互场景的参考

---

### 5. 理解 MCP 输出

**designContext 包含**：

```typescript
{
  code: string;              // React + Tailwind 代码
  styles: {
    [selector]: {
      [property]: string;    // CSS 变量或具体值
    }
  };
  screenshot?: string;       // Base64 或 URL
  metadata: {
    nodeType: string;
    dimensions: { width, height };
    children?: Array;
  }
}
```

**关键理解**：

- `code` 是**设计表示**，不是最终代码
- `styles` 中的 CSS 变量需要提取 fallback 值
- Tailwind 类需要转换为项目 Token

---

## 📐 样式值提取

### CSS 变量格式解析

Figma MCP 输出的样式通常是：

```css
var(--color-border, #d1d5d6)
var(--spacing-md, 16px)
var(--font-size-body, 14px)
```

**提取 fallback 值**：

```
var(--name, VALUE) → VALUE
```

提取出的 VALUE 用于匹配项目 Token。

---

## 🔄 转换规则

### 从 Figma 输出到项目代码

**1. 不要直接使用 Figma 生成的代码**

- Tailwind 类 → 项目 Design Token
- 内联样式 → useCreateStyles hook
- 任意组件名 → Neat Design / TopUp 组件

**2. 重用项目组件**
优先顺序：

1. TopUp 包装组件（如 TopUpTableV2）
2. Neat Design 组件（如 Table, Button）
3. 自定义组件（如必须）

**3. 遵循项目样式系统**

```typescript
// ❌ 错误：直接使用 Figma 值
<div style={{ color: '#00131c', fontSize: '14px' }} />

// ❌ 错误：使用 Tailwind
<div className="text-gray-900 text-sm" />

// ✅ 正确：使用项目 Token
const styles = useStyles();
<div className={styles.text} />

// styles.text 使用：
color: token['color-text-primary']
fontSize: token['font-size-body-medium']
```

---

## ⚠️ 常见错误

### 1. 跳过 get_design_context 直接用 get_metadata

**问题**：metadata 只有结构信息，没有样式和代码
**解决**：始终先尝试 get_design_context

### 2. 认为 Figma 输出是最终代码

**问题**：会生成不符合项目规范的代码
**解决**：将输出视为"设计草稿"，需要转换为项目规范

### 3. 忽略响应大小

**问题**：大型设计稿会导致响应截断
**解决**：检查响应完整性，必要时分步获取

### 4. 不获取截图

**问题**：无法验证生成代码的视觉效果
**解决**：获取截图作为验证参考

---

## ✅ 最佳实践

1. **始终检查响应完整性**
2. **提取 fallback 值而非 CSS 变量名**
3. **将 Figma 输出作为设计参考，而非代码模板**
4. **优先使用项目现有组件**
5. **所有样式使用项目 Token 系统**
6. **获取截图用于最终验证**

---

## 🔗 相关文档

- [样式映射策略](./style-mapping-strategy.md) - 如何将 Figma 样式映射到项目 Token
- [错误处理指南](./error-handling.md) - MCP 调用失败时的处理方案
