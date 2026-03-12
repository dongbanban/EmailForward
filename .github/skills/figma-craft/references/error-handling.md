# 错误处理与恢复策略

本文档定义处理各类错误的标准流程和恢复机制。

## 目录

- [错误处理原则](#错误处理原则)
- [错误分类](#错误分类)
  - [类型 A：MCP 调用失败](#类型-amcp-调用失败)
    - [A1：Figma MCP 工具调用失败](#a1figma-mcp-工具调用失败)
    - [A2：响应数据不完整](#a2响应数据不完整)
  - [类型 B：Token 匹配失败](#类型-btoken-匹配失败)
    - [B1：找不到合适的 Token](#b1找不到合适的-token)
    - [B2：Token 系统未初始化](#b2token-系统未初始化)
  - [类型 C：代码生成错误](#类型-c代码生成错误)
    - [C1：TypeScript 类型错误](#c1typescript-类型错误)
    - [C2：导入路径错误](#c2导入路径错误)
    - [C3：样式冲突](#c3样式冲突)
  - [类型 D：文件操作错误](#类型-d文件操作错误)
    - [D1：文件已存在](#d1文件已存在)
    - [D2：权限错误](#d2权限错误)
  - [类型 E：设计不符合规范](#类型-e设计不符合规范)
    - [E1：设计未使用 Design Token](#e1设计未使用-design-token)
    - [E2：设计与实现差距过大](#e2设计与实现差距过大)
- [预防性措施](#预防性措施)
  - [1. 操作前检查](#1-操作前检查)
  - [2. 备份机制](#2-备份机制)
  - [3. 分步验证](#3-分步验证)
- [相关文档](#相关文档)

---

## 🎯 错误处理原则

1. **及时发现**：执行每步操作后立即验证
2. **清晰反馈**：告知用户发生了什么、为什么、如何修复
3. **安全回退**：所有破坏性操作前先备份
4. **渐进式处理**：从自动修复 → 提示建议 → 请求人工介入

---

## 🔴 错误分类

### 类型 A：MCP 调用失败

#### A1：Figma MCP 工具调用失败

**症状**：

```
Error: mcp_figma_get_design_context failed
```

**可能原因**：

1. Figma 文件/节点不存在
2. 权限不足（私有文件）
3. 网络问题
4. Figma API 限流

**处理流程**：

```typescript
try {
  const context = await mcp_figma_get_design_context({ fileKey, nodeId });
} catch (error) {
  // 1. 识别错误类型
  if (error.message.includes("404")) {
    console.error("❌ 节点不存在，请检查：");
    console.error(`   文件 Key: ${fileKey}`);
    console.error(`   节点 ID: ${nodeId}`);
    console.error("");
    console.error("建议操作：");
    console.error("A. 检查 URL 是否正确复制");
    console.error("B. 确认节点未被删除");
    console.error("C. 在 Figma 中重新选中节点并获取链接");
    return;
  }

  if (error.message.includes("403")) {
    console.error("❌ 权限不足，请：");
    console.error("1. 确认你有该文件的查看权限");
    console.error("2. 如果是团队文件，请联系管理员授权");
    console.error("3. 检查 Figma token 是否有效");
    return;
  }

  if (error.message.includes("rate limit")) {
    console.error("⚠️ Figma API 限流，将在 60 秒后重试");
    await sleep(60000);
    return retry();
  }

  // 通用网络错误
  console.error("❌ Figma API 调用失败：", error.message);
  console.error("");
  console.error("建议操作：");
  console.error("A. 检查网络连接");
  console.error("B. 检查 MCP 服务状态");
  console.error("C. 稍后重试");
}
```

#### A2：响应数据不完整

**症状**：

```javascript
{
  content: "... (更多内容未显示，总长度: 45000 字符)",
  isTruncated: true
}
```

**处理流程**：

参考 [Figma MCP 集成规范 - 响应截断处理](./figma-mcp-integration.md#响应截断处理)

---

### 类型 B：Token 匹配失败

#### B1：找不到合适的 Token

**症状**：

```
⚠️ 颜色 #ff6b00 未匹配到合适的 Token
   最接近：color-primary (#ff5500) - 置信度 65%
```

**处理流程**：

```typescript
if (match.confidence < 0.8) {
  console.warn(`⚠️ Token 匹配置信度较低：`);
  console.warn(`  样式: ${styleName}`);
  console.warn(`  Figma 值: ${figmaValue}`);
  console.warn(`  最接近: ${match.token} (${match.confidence * 100}%)`);
  console.warn("");

  const choice = await askUser([
    "A. 使用最接近的 Token（可能有细微差异）",
    "B. 临时使用原始值（需后续优化）",
    "C. 暂停，向设计师确认应使用哪个 Token",
    "D. 创建新的 Token",
  ]);

  switch (choice) {
    case "A":
      return token[match.token];
    case "B":
      console.warn(`⚠️ 硬编码值：${figmaValue}`);
      console.warn(`  位置：${currentFile}:${currentLine}`);
      console.warn(`  TODO: 后续替换为 Token`);
      return figmaValue;
    case "C":
      console.info("已暂停，请与设计师确认后继续");
      return await waitUserResume();
    case "D":
      console.info("请按以下步骤创建 Token：");
      console.info(`1. 在 theme/tokens.ts 中添加：`);
      console.info(`   'color-xxx': '${figmaValue}'`);
      console.info(`2. 完成后输入 Token 名称继续`);
      return await waitUserInput();
  }
}
```

#### B2：Token 系统未初始化

**症状**：

```
Error: useToken is not defined
```

**处理流程**：

```typescript
console.error("❌ 未找到 Token 系统初始化代码");
console.error("");
console.error("可能原因：");
console.error("1. 当前文件不在 React 组件上下文中");
console.error("2. 缺少 ant-design 依赖");
console.error("");

const context = await analyzeFileContext(currentFile);

if (context.isReactComponent) {
  console.info("✅ 这是 React 组件，将添加 useToken");
  // 自动在文件顶部添加
  // import { useToken } from 'ant-design';
  // const token = useToken();
} else {
  console.error("❌ 非 React 组件文件无法使用 Token");
  console.error("");
  console.error("建议操作：");
  console.error("A. 如果是工具函数，传入 token 参数");
  console.error("B. 如果是样式文件，使用 CSS 变量");
}
```

---

### 类型 C：代码生成错误

#### C1：TypeScript 类型错误

**症状**：

```
Error: Property 'xxx' does not exist on type 'YYY'
```

**处理流程**：

```typescript
// 1. 立即获取 TypeScript 错误
const errors = await getTypeScriptErrors(filePath);

if (errors.length > 0) {
  console.error(`❌ 生成的代码存在 ${errors.length} 个 TypeScript 错误：`);

  errors.forEach((err, idx) => {
    console.error(`\n${idx + 1}. ${err.message}`);
    console.error(`   位置：${err.file}:${err.line}`);
    console.error(`   代码：${err.code}`);
  });

  console.error("\n开始自动修复...");

  // 2. 尝试自动修复
  for (const err of errors) {
    const fixed = await autoFixTypeError(err);

    if (fixed) {
      console.info(`✅ 已修复：${err.message}`);
    } else {
      console.warn(`⚠️ 无法自动修复：${err.message}`);
      console.warn(`   可能需要：`);
      console.warn(`   - 添加类型定义 (types/xxx.ts)`);
      console.warn(`   - 更新接口声明`);
      console.warn(`   - 修正导入路径`);
    }
  }

  // 3. 再次验证
  const remainingErrors = await getTypeScriptErrors(filePath);

  if (remainingErrors.length === 0) {
    console.info("\n✅ 所有 TypeScript 错误已修复");
  } else {
    console.error(`\n❌ 仍有 ${remainingErrors.length} 个错误需人工修复`);
    // 详细展示剩余错误
  }
}
```

#### C2：导入路径错误

**症状**：

```
Error: Cannot find module '@/components/XXX'
```

**处理流程**：

```typescript
console.error("❌ 导入路径错误：", importPath);

// 1. 查找正确路径
const correctPath = await findComponent(componentName);

if (correctPath) {
  console.info(`✅ 找到正确路径：${correctPath}`);
  console.info(`将自动修复导入语句`);

  // 自动替换
  await replaceImport(oldPath, correctPath);
} else {
  console.error(`❌ 未找到组件：${componentName}`);
  console.error("");
  console.error("可能原因：");
  console.error("1. 组件确实不存在，需要先创建");
  console.error("2. 组件在不同的位置（请提供路径）");
  console.error("3. 组件名拼写错误");

  const choice = await askUser([
    "A. 创建新组件",
    "B. 手动指定现有组件路径",
    "C. 修正组件名",
  ]);

  // 根据用户选择处理
}
```

#### C3：样式冲突

**症状**：

```
Warning: CSS property 'margin' is overridden
```

**处理流程**：

```typescript
console.warn("⚠️ 检测到样式冲突：");
console.warn(`  属性：${property}`);
console.warn(`  第一次定义：${firstValue} (${firstLocation})`);
console.warn(`  冲突定义：${secondValue} (${secondLocation})`);
console.warn("");

// 自动分析优先级
const priority = analyzeStylePriority([firstValue, secondValue]);

console.info(`建议保留：${priority.recommended} (${priority.reason})`);

const choice = await askUser([
  `A. 保留 ${priority.recommended}（推荐）`,
  `B. 保留 ${priority.alternative}`,
  "C. 两者都保留（可能导致不一致）",
]);

// 根据选择处理
```

---

### 类型 D：文件操作错误

#### D1：文件已存在

**症状**：

```
Error: File already exists: src/pages/NewPage.tsx
```

**处理流程**：

```typescript
console.warn("⚠️ 文件已存在：", filePath);

// 1. 检查是否为意外重复
const existing = await readFile(filePath);
const similarity = calculateSimilarity(newContent, existing);

if (similarity > 0.9) {
  console.warn("⚠️ 新内容与现有文件几乎相同（相似度 >90%）");
  console.warn("可能是重复操作，建议跳过");

  const choice = await askUser([
    "A. 跳过（不修改现有文件）",
    "B. 继续（查看差异后决定）",
  ]);

  if (choice === "A") return;
}

// 2. 展示差异
console.info("\n现有文件与新内容的差异：");
showDiff(existing, newContent);

// 3. 提供选项
const choice = await askUser([
  "A. 覆盖现有文件",
  "B. 合并内容（保留现有 + 添加新内容）",
  "C. 创建新文件（添加后缀 .new.tsx）",
  "D. 取消操作",
]);

switch (choice) {
  case "A":
    console.warn("⚠️ 将覆盖现有文件，先创建备份");
    await createBackup(filePath);
    await writeFile(filePath, newContent);
    break;
  case "B":
    const merged = await mergeContent(existing, newContent);
    await writeFile(filePath, merged);
    break;
  case "C":
    await writeFile(filePath + ".new.tsx", newContent);
    break;
  case "D":
    return;
}
```

#### D2：权限错误

**症状**：

```
Error: EACCES: permission denied
```

**处理流程**：

```typescript
console.error("❌ 权限不足，无法写入文件：", filePath);
console.error("");
console.error("可能原因：");
console.error("1. 文件被其他程序占用");
console.error("2. 目录权限不足");
console.error("3. 磁盘只读");
console.error("");
console.error("建议操作：");
console.error("A. 关闭可能占用文件的程序");
console.error("B. 检查目录权限");
console.error("C. 使用管理员权限运行");
```

---

### 类型 E：设计不符合规范

#### E1：设计未使用 Design Token

**症状**：
Figma 输出中全是硬编码值，没有 `var(--xxx)`

**处理流程**：

```typescript
const hasTokens = checkForTokenUsage(designContext.styles);

if (!hasTokens) {
  console.warn("⚠️ 设计未使用 Design Token（全是硬编码值）");
  console.warn("");
  console.warn("这会导致：");
  console.warn("- Token 匹配全依赖色值对比（准确度降低）");
  console.warn("- 生成的代码可能不符合设计系统规范");
  console.warn("");
  console.warn("建议操作：");
  console.warn("A. 联系设计师重新应用 Token 后再转换");
  console.warn("B. 继续（Token 匹配准确度可能下降）");

  const choice = await askUser();

  if (choice === "A") {
    console.info("已暂停，请设计师更新后继续");
    return;
  } else {
    console.warn("⚠️ 继续处理，但请在生成后仔细审查 Token 使用");
  }
}
```

#### E2：设计与实现差距过大

**症状**：
需要生成的组件在项目中完全不存在对应组件

**处理流程**：

```typescript
const components = extractComponents(designContext.html);
const missing = [];

for (const comp of components) {
  const exists = await searchComponent(comp.name, comp.type);
  if (!exists) {
    missing.push(comp);
  }
}

if (missing.length > 0) {
  console.warn(`⚠️ 设计使用了 ${missing.length} 个项目中不存在的组件：`);
  missing.forEach((c) => console.warn(`  - ${c.name}`));
  console.warn("");
  console.warn("建议操作：");
  console.warn("A. 先创建这些基础组件");
  console.warn("B. 使用基础 HTML 元素替代（可能不符合设计系统）");
  console.warn("C. 咨询设计师能否用现有组件替代");

  // 等待用户决策
}
```

---

## 🛡️ 预防性措施

### 1. 操作前检查

```typescript
async function preflightCheck() {
  const checks = [
    { name: "目标目录是否存在", fn: checkDirectory },
    { name: "是否有写入权限", fn: checkPermissions },
    { name: "磁盘空间是否充足", fn: checkDiskSpace },
    { name: "Token 系统是否可用", fn: checkTokenSystem },
    { name: "TypeScript 是否配置正确", fn: checkTSConfig },
  ];

  for (const check of checks) {
    const result = await check.fn();
    if (!result.ok) {
      console.error(`❌ ${check.name}：${result.error}`);
      return false;
    }
  }

  return true;
}
```

### 2. 备份机制

所有破坏性操作前自动备份：

```typescript
async function safeWrite(filePath, content) {
  // 1. 如果文件存在，先备份
  if (await fileExists(filePath)) {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await copyFile(filePath, backupPath);
    console.info(`✅ 已创建备份：${backupPath}`);
  }

  // 2. 写入新内容
  try {
    await writeFile(filePath, content);
    console.info(`✅ 文件已更新：${filePath}`);
  } catch (error) {
    console.error(`❌ 写入失败，备份未受影响`);
    throw error;
  }
}
```

### 3. 分步验证

```typescript
async function generateComponent() {
  // Step 1: 获取设计
  const design = await getDesign();
  if (!design) return handleError("获取设计失败");

  // Step 2: 匹配 Token
  const styles = await matchTokens(design);
  if (styles.hasErrors) return handleError("Token 匹配失败");

  // Step 3: 生成代码
  const code = await generateCode(styles);
  if (!code) return handleError("代码生成失败");

  // Step 4: 验证 TypeScript
  const tsErrors = await validateTS(code);
  if (tsErrors.length > 0) return handleError("类型错误");

  // Step 5: 写入文件
  await safeWrite(filePath, code);

  console.info("✅ 组件生成成功");
}
```

---

## 🔗 相关文档

- [Figma MCP 集成规范](./figma-mcp-integration.md) - MCP 调用错误处理
- [样式映射策略](./style-mapping-strategy.md) - Token 匹配失败处理
- [成功验收标准](./success-criteria.md) - 验证检查清单
