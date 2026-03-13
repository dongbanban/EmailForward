# 样式映射策略

本文档定义了如何智能地将 Figma 样式值映射到项目 Design Token 系统。

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

- [核心目标](#核心目标)
- [映射流程](#映射流程)
  - [步骤 1：提取 Figma 样式值](#步骤-1提取-figma-样式值)
  - [步骤 2：加载项目 Token 注册表](#步骤-2加载项目-token-注册表)
  - [步骤 3：智能匹配](#步骤-3智能匹配)
- [颜色匹配策略](#颜色匹配策略)
  - [精确匹配](#精确匹配)
  - [近似匹配（色差计算）](#近似匹配色差计算)
- [尺寸匹配策略](#尺寸匹配策略)
  - [近似匹配（允许误差）](#近似匹配允许误差)
- [间距匹配策略](#间距匹配策略)
- [置信度分级处理](#置信度分级处理)
  - [高置信度（≥0.8）](#高置信度08)
  - [中置信度（0.5-0.8）](#中置信度05-08)
  - [低置信度（<0.5）](#低置信度05)
- [特殊情况处理](#特殊情况处理)
  - [1. 透明度处理](#1-透明度处理)
  - [2. 渐变色](#2-渐变色)
  - [3. 阴影](#3-阴影)
- [匹配结果格式](#匹配结果格式)
- [最佳实践](#最佳实践)
- [反模式](#反模式)
- [相关文档](#相关文档)

---

## 🎯 核心目标

将 Figma 设计中的样式值（颜色、尺寸、间距等）映射到项目的 Token，而不是硬编码具体值。

**为什么重要**：

- ✅ 保持设计系统一致性
- ✅ 支持主题切换
- ✅ 便于全局样式调整
- ✅ 提高代码可维护性

---

## 映射流程

### 步骤 1：提取 Figma 样式值

从 `designContext.styles` 中提取 fallback 值：

```typescript
const figmaStyles = {
  borderColor: extractFallback("var(--table-border, #d1d5d6)"), // → #d1d5d6
  backgroundColor: extractFallback("var(--bg, white)"), // → white
  textColor: extractFallback("var(--text, #00131c)"), // → #00131c
  fontSize: extractFallback("var(--font-size, 14px)"), // → 14px
  padding: extractFallback("var(--spacing, 16px)"), // → 16px
};
```

### 步骤 2：加载项目 Token 注册表

```typescript
const token = useToken(); // 从 @derbysoft/neat-design 获取

const tokenRegistry = {
  colors: filterTokens(token, "color-"),
  sizes: filterTokens(token, ["size-", "font-size-"]),
  spacing: filterTokens(token, ["spacing-", "padding-", "margin-"]),
};
```

### 步骤 3：智能匹配

对每个样式值，找到最匹配的 Token。

---

## 颜色匹配策略

### 精确匹配

```typescript
function matchColor(figmaColor, colorTokens) {
  // 1. 标准化颜色格式
  const normalized = normalizeColor(figmaColor);

  // 2. 精确比对
  for (const [tokenName, tokenValue] of colorTokens) {
    if (normalizeColor(tokenValue) === normalized) {
      return { token: tokenName, confidence: 1.0 };
    }
  }

  return null;
}
```

**标准化规则**：

- HEX → 统一小写，移除 `#`
- RGB(A) → 转换为 HEX
- 颜色名 → 转换为 HEX（red → #ff0000）

**示例**：

```
Figma: #D1D5D6
Token: color-border-divider → #d1d5d6
匹配：✅ 精确匹配，置信度 1.0
```

### 近似匹配（色差计算）

如果精确匹配失败，使用色差计算：

```typescript
function colorDistance(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  // 使用欧几里得距离
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2),
  );
}
```

**阈值**：

- 距离 < 10：高置信度（0.9+）
- 距离 10-30：中置信度（0.7-0.9）
- 距离 > 30：低置信度（<0.7）

---

## 尺寸匹配策略

### 近似匹配（允许误差）

```typescript
function matchSize(figmaSize, sizeTokens) {
  const targetPx = parsePx(figmaSize); // '14px' → 14

  const matches = sizeTokens.map(([tokenName, tokenValue]) => {
    const tokenPx = parsePx(tokenValue);
    const diff = Math.abs(targetPx - tokenPx);

    return {
      token: tokenName,
      diff,
      confidence: calculateSizeConfidence(diff),
    };
  });

  // 返回差距最小的
  return matches.sort((a, b) => a.diff - b.diff)[0];
}
```

**置信度计算**：

```typescript
function calculateSizeConfidence(diff) {
  if (diff === 0) return 1.0; // 精确匹配
  if (diff <= 2) return 0.95; // ±2px：高置信度
  if (diff <= 4) return 0.85; // ±4px：中高置信度
  if (diff <= 8) return 0.7; // ±8px：中等置信度
  return 0.5; // >8px：低置信度
}
```

**示例**：

```
Figma: 14px
Tokens:
  - font-size-small: 12px    (diff 2, confidence 0.95)
  - font-size-body: 14px     (diff 0, confidence 1.0) ✅
  - font-size-large: 16px    (diff 2, confidence 0.95)

选择：font-size-body
```

---

## 间距匹配策略

间距使用与尺寸相同的策略，但阈值稍宽松：

**置信度计算**：

```typescript
function calculateSpacingConfidence(diff) {
  if (diff === 0) return 1.0;
  if (diff <= 4) return 0.9; // ±4px
  if (diff <= 8) return 0.75; // ±8px
  return 0.6;
}
```

原因：间距容忍度更高，微小差异对视觉影响较小。

---

## 置信度分级处理

### 高置信度（≥0.8）

**操作**：直接使用匹配的 Token

```typescript
if (match.confidence >= 0.8) {
  return token[match.token];
}
```

### 中置信度（0.5-0.8）

**操作**：使用但标记供审核

```typescript
if (match.confidence >= 0.5) {
  console.warn(`⚠️ 中置信度匹配：`);
  console.warn(`  样式: ${styleName}`);
  console.warn(`  Figma 值: ${figmaValue}`);
  console.warn(`  匹配 Token: ${match.token} (${match.confidence * 100}%)`);
  console.warn(`  建议人工审核`);

  return token[match.token];
}
```

### 低置信度（<0.5）

**操作**：提示用户决策

```typescript
console.error(`❌ 未找到合适的 Token 匹配：`);
console.error(`  样式: ${styleName}`);
console.error(`  Figma 值: ${figmaValue}`);
console.error(`  最接近: ${match.token} (${match.confidence * 100}%)`);
console.error(``);
console.error(`建议操作：`);
console.error(`A. 使用最接近的 Token: ${match.token}`);
console.error(`B. 创建新的 Token: color-xxx`);
console.error(`C. 临时使用原始值（需后续优化）`);

// 等待用户选择
```

---

## 特殊情况处理

### 1. 透明度处理

```typescript
// Figma: rgba(0, 19, 28, 0.5)
// 策略：匹配基础颜色 + 记录透明度

const baseColor = "#00131c";
const alpha = 0.5;

const match = matchColor(baseColor, colorTokens);
// 生成代码时：rgba(${token[match.token]}, ${alpha})
```

### 2. 渐变色

```typescript
// Figma: linear-gradient(90deg, #ff0000, #00ff00)
// 策略：分别匹配起止颜色

const [color1Match, color2Match] = gradientColors.map((c) =>
  matchColor(c, colorTokens),
);

// 如果都有匹配，使用 Token
// 否则建议创建渐变 Token
```

### 3. 阴影

```typescript
// Figma: 0 2px 8px rgba(0, 0, 0, 0.15)
// 策略：匹配完整阴影 Token

const shadowMatch = matchShadow(figmaShadow, shadowTokens);
// shadow-sm, shadow-md, shadow-lg 等
```

---

## 匹配结果格式

```typescript
interface MatchResult {
  token: string;           // Token 名称
  confidence: number;      // 0-1 的置信度
  originalValue: string;   // Figma 原始值
  tokenValue: string;      // Token 实际值
  diff?: number;          // 数值差异（如适用）
}

// 示例
{
  token: 'color-border-divider',
  confidence: 1.0,
  originalValue: '#d1d5d6',
  tokenValue: '#d1d5d6',
  diff: 0
}
```

---

## 最佳实践

1. **优先精确匹配**
   - 先尝试精确匹配，再尝试近似匹配

2. **设置合理阈值**
   - 根据样式类型调整容差：颜色严格，间距宽松

3. **记录置信度**
   - 所有匹配都应计算置信度，便于审核

4. **提供清晰反馈**
   - 中低置信度匹配必须告知用户

5. **支持人工决策**
   - 低置信度时，提供多个选项供用户选择

6. **持续优化**
   - 收集匹配失败案例，优化算法和阈值

---

## 反模式

❌ **直接使用 Figma 值**

```typescript
// 错误示例
<div style={{ color: '#00131c', fontSize: '14px' }} />
```

❌ **跳过匹配，手动选择 Token**

```typescript
// 错误示例：没有基于实际值匹配
const borderColor = token["color-border"]; // 可能不匹配
```

❌ **忽略置信度**

```typescript
// 错误示例：低置信度也直接使用
if (match) {
  return token[match.token]; // 没检查 confidence
}
```

✅ **正确做法**

```typescript
const match = matchColor(figmaColor, colorTokens);

if (match.confidence >= 0.8) {
  return token[match.token];
} else if (match.confidence >= 0.5) {
  console.warn(`中置信度匹配，建议审核`);
  return token[match.token];
} else {
  await askUserDecision(match);
}
```

---

## 相关文档

- [Figma MCP 集成规范](./figma-mcp-integration.md) - 如何获取样式值
- [成功验收标准](./success-criteria.md) - Token 使用率要求
