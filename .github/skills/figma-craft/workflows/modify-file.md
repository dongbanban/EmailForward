# 修改文件工作流

本文档定义如何根据 Figma 设计修改现有文件，在保持原有代码的基础上进行增量更新。

## 目录

- [适用场景](#适用场景)
- [准备检查](#准备检查)
  - [前置条件](#前置条件)
  - [风险评估](#风险评估)
- [执行流程](#执行流程)
  - [第 1 步：读取现有文件](#第-1-步读取现有文件)
  - [第 2 步：获取 Figma 新设计](#第-2-步获取-figma-新设计)
  - [第 3 步：对比差异分析](#第-3-步对比差异分析)
  - [第 4 步：制定修改策略](#第-4-步制定修改策略)
  - [第 5 步：创建备份（推荐）](#第-5-步创建备份推荐)
  - [第 6 步：执行修改](#第-6-步执行修改)
  - [第 7 步：TypeScript 类型检查](#第-7-步typescript-类型检查)
  - [第 8 步：代码质量检查](#第-8-步代码质量检查)
  - [第 9 步：功能测试](#第-9-步功能测试)
  - [第 10 步：生成修改报告](#第-10-步生成修改报告)
- [成功标准](#成功标准)
  - [核心标准](#核心标准)
  - [次要标准](#次要标准)
- [常见错误](#常见错误)
  - [错误 1：修改范围过大](#错误-1修改范围过大)
  - [错误 2：未保持代码风格一致](#错误-2未保持代码风格一致)
  - [错误 3：破坏依赖关系](#错误-3破坏依赖关系)
- [相关文档](#相关文档)

---

## 🎯 适用场景

- ✅ 文件已存在，需要根据新设计调整
- ✅ 仅修改部分UI，不影响核心逻辑
- ✅ 保留现有功能，增加新元素
- ✅ 样式微调（颜色、间距、尺寸）

---

## 📋 准备检查

### 前置条件

```markdown
- [ ] 已解析 Figma URL（fileKey + nodeId）
- [ ] 已确认目标文件路径
- [ ] 目标文件存在且可编辑
- [ ] 已确认意图为"修改现有文件"
```

### 风险评估

```markdown
修改影响范围：

- [ ] 仅UI样式变化（低风险）
- [ ] 涉及组件结构调整（中风险）
- [ ] 需要修改数据逻辑（高风险）

是否需要备份：

- [ ] 是（推荐，尤其是大范围修改）
- [ ] 否（仅微小样式调整）
```

---

## 🔄 执行流程

### 第 1 步：读取现有文件

**目标**：理解现有代码的结构和逻辑。

**读取内容**：

```typescript
const existingFile = await readFile(targetPath);
```

**分析要点**：

1. **组件结构**
   - 是函数组件还是类组件
   - 使用了哪些 Hooks
   - State 管理方式

2. **样式实现**
   - 使用 Emotion、styled-components 还是 CSS Modules
   - 样式是内联还是独立文件
   - 是否已使用 Token

3. **依赖关系**
   - 导入了哪些组件
   - 使用了哪些工具函数
   - Props 接口定义

4. **业务逻辑**
   - 数据获取方式
   - 事件处理逻辑
   - 状态管理

---

### 第 2 步：获取 Figma 新设计

**调用**：

```typescript
mcp_figma_get_design_context({
  fileKey: "...",
  nodeId: "...",
});
```

**获取内容**：同新页面/新组件工作流

**详细规范**：参考 [Figma MCP 集成规范](../reference/figma-mcp-integration.md)

---

### 第 3 步：对比差异分析

**目标**：识别设计变更点。

**对比维度**：

#### A. 布局结构变化

```markdown
- [ ] 元素增加/删除
- [ ] 元素位置调整
- [ ] 容器嵌套关系变化
```

#### B. 样式变化

```markdown
- [ ] 颜色变化
- [ ] 尺寸变化（宽高、字号）
- [ ] 间距变化（padding、margin）
- [ ] 边框/圆角变化
- [ ] 阴影变化
```

#### C. 组件变化

```markdown
- [ ] 新增组件
- [ ] 删除组件
- [ ] 替换组件（如 Input → Select）
```

#### D. 交互变化

```markdown
- [ ] 新增交互（点击、输入等）
- [ ] 修改交互行为
- [ ] 删除交互
```

**输出差异报告**：

```
📊 差异分析报告：

布局变化：
+ 新增：右上角添加"导出"按钮
- 删除：左侧 Sidebar
~ 调整：表格宽度从 80% 改为 100%

样式变化：
~ 主标题字号：24px → 28px
~ 按钮圆角：4px → 8px
+ 新增：卡片阴影效果

组件变化：
+ 新增：<ExportButton />
- 删除：<Sidebar />

交互变化：
+ 新增：导出按钮点击事件
```

---

### 第 4 步：制定修改策略

**根据差异分析制定最小化修改方案。**

#### 策略 A：仅样式修改（最安全）

**触发条件**：无结构和组件变化，仅样式调整

**操作**：

- 定位到样式定义（Emotion css 或 style 对象）
- 更新对应样式值（使用 Token）
- 不触碰逻辑代码

**示例**：

```typescript
// 修改前
const titleStyles = css({
  fontSize: token["font-size-lg"], // 24px
  color: token["color-text-primary"],
});

// 修改后
const titleStyles = css({
  fontSize: token["font-size-xl"], // 28px
  color: token["color-text-primary"],
});
```

#### 策略 B：增量添加（中等风险）

**触发条件**：新增元素/组件，不影响现有结构

**操作**：

- 在适当位置插入新代码
- 添加必要的导入
- 添加事件处理函数（如需要）

**示例**：

```typescript
// 在 Header 区域添加导出按钮

// 1. 添加导入
+ import ExportButton from '@/components/ExportButton';

// 2. 添加事件处理
+ const handleExport = useCallback(() => {
+   // 导出逻辑
+ }, [data]);

// 3. 插入 JSX
<Header>
  <Title>用户列表</Title>
+ <ExportButton onClick={handleExport} />
</Header>
```

#### 策略 C：删除/替换（高风险）

**触发条件**：删除元素或替换组件

**操作**：

- 先备份原文件
- 移除废弃代码
- 清理相关依赖
- 更新类型定义

**示例**：

```typescript
// 删除 Sidebar

// 1. 移除导入
- import Sidebar from '@/components/Sidebar';

// 2. 移除状态（如有）
- const [sidebarOpen, setSidebarOpen] = useState(false);

// 3. 移除 JSX
<Layout>
- <Sidebar isOpen={sidebarOpen} />
  <Content>...</Content>
</Layout>

// 4. 调整布局（Sidebar 移除后，Content 需要占满宽度）
```

---

### 第 5 步：创建备份（推荐）

**适用情况**：

- 策略 B、C（有结构变化）
- 文件较大（>300 行）
- 关键业务文件

**操作**：

```typescript
const backupPath = `${targetPath}.backup-${Date.now()}`;
await copyFile(targetPath, backupPath);

console.info(`✅ 已创建备份：${backupPath}`);
```

**提示用户**：

```
✅ 创建备份
   原文件：src/pages/UserList/UserList.tsx
   备份至：src/pages/UserList/UserList.tsx.backup-1701234567890

如修改后不满意，可执行：
  mv UserList.tsx.backup-1701234567890 UserList.tsx
恢复原文件
```

---

### 第 6 步：执行修改

**根据策略逐项修改。**

#### 修改规则：

1. **精确替换**
   - 使用 `replace_string_in_file` 工具
   - 包含足够上下文（前后各3行）
   - 确保唯一匹配

2. **逐步验证**
   - 每次修改后立即检查 TypeScript 错误
   - 发现错误立即修复
   - 避免修改堆积

3. **保持风格一致**
   - 缩进、空格与原文件保持一致
   - 命名规范与现有代码一致
   - 注释风格一致

**示例修改序列**：

```typescript
// 修改 1：更新标题字号
replace_string_in_file({
  oldString: `
    fontSize: token['font-size-lg'],
    color: token['color-text-primary']
  `,
  newString: `
    fontSize: token['font-size-xl'],
    color: token['color-text-primary']
  `,
});

// 验证 TypeScript
await checkTypeScriptErrors(targetPath);

// 修改 2：添加导出按钮导入
replace_string_in_file({
  oldString: `
import { Button } from 'Ant-design';
import UserTable from '@/components/UserTable';
  `,
  newString: `
import { Button } from 'Ant-design';
import UserTable from '@/components/UserTable';
import ExportButton from '@/components/ExportButton';
  `,
});

// 验证 TypeScript
await checkTypeScriptErrors(targetPath);

// 修改 3：添加导出按钮
// ...
```

---

### 第 7 步：TypeScript 类型检查

**全面验证**：

```bash
tsc --noEmit
```

**处理错误**：参考 [错误处理策略](../reference/error-handling.md#c1typescript-类型错误)

**目标**：0 errors, 0 warnings

---

### 第 8 步：代码质量检查

**ESLint 检查**：

```bash
npm run lint -- src/pages/UserList/UserList.tsx
```

**格式检查**：

```bash
npm run format -- src/pages/UserList/UserList.tsx
```

---

### 第 9 步：功能测试

**测试清单**：

```markdown
1. 基础渲染
   - [ ] 页面/组件正常加载
   - [ ] 无控制台错误

2. 修改部分验证
   - [ ] 新增元素正常显示
   - [ ] 样式修改生效
   - [ ] 交互行为正确

3. 原有功能验证
   - [ ] 现有功能未受影响
   - [ ] 数据加载正常
   - [ ] 事件处理正常

4. 视觉对比
   - [ ] 对比 Figma 设计
   - [ ] 检查修改部分的视觉还原度
```

---

### 第 10 步：生成修改报告

**输出**：

```markdown
✅ 文件修改完成

文件：src/pages/UserList/UserList.tsx
备份：src/pages/UserList/UserList.tsx.backup-1701234567890

修改摘要：

1. 样式调整 (3 处)
   - 标题字号：24px → 28px
   - 按钮圆角：4px → 8px
   - 新增卡片阴影

2. 组件新增 (1 个)
   - ExportButton（右上角）

3. 事件添加 (1 个)
   - handleExport 导出功能

验证结果：

- TypeScript: ✅ 0 errors
- ESLint: ✅ 0 errors, 1 warning (非关键)
- 功能测试: ✅ 全部通过

视觉对比：

- 还原度：98%
- 微小差异：阴影稍深（可接受）

建议：

1. 本地测试所有功能
2. 对比 Figma 确保视觉一致
3. 如不满意，执行以下命令恢复：
   mv UserList.tsx.backup-1701234567890 UserList.tsx
```

---

## ✅ 成功标准

修改成功需满足：

### 核心标准

- ✅ TypeScript 类型检查 0 错误
- ✅ 原有功能未受影响
- ✅ 修改部分视觉还原度 ≥95%
- ✅ 无新增 ESLint 错误

### 次要标准

- ✅ 代码风格与原文件一致
- ✅ Token 使用率维持或提升
- ✅ 修改范围最小化（仅改必要部分）

**详细评判标准**：参考 [成功验收标准](../reference/success-criteria.md)

---

## 🚫 常见错误

### 错误 1：修改范围过大

**症状**：本应仅修改样式，却重写了大半文件

**后果**：

- 增加出错风险
- 可能破坏原有功能
- 难以审查变更

**正确做法**：

```
❌ 错误：重写整个组件
✅ 正确：精确定位修改点，只改必要部分

示例：
需求：修改按钮颜色
❌ 重写整个 Button 组件
✅ 只修改 color 样式属性
```

### 错误 2：未保持代码风格一致

**症状**：新增代码的缩进、命名与原文件不一致

**示例**：

```typescript
// 原文件使用 2 空格缩进
function handleClick() {
  console.log("click");
}

// ❌ 新增代码使用 4 空格
function handleExport() {
  console.log("export");
}

// ✅ 保持 2 空格
function handleExport() {
  console.log("export");
}
```

### 错误 3：破坏依赖关系

**症状**：删除某组件时未清理相关引用

**示例**：

```typescript
// 删除了 Sidebar 组件
- import Sidebar from './Sidebar';
- <Sidebar />

// ❌ 忘记删除相关状态
const [sidebarOpen, setSidebarOpen] = useState(false);  // 无用代码

// ❌ 忘记删除相关函数
const toggleSidebar = () => setSidebarOpen(!sidebarOpen);  // 无用代码
```

**正确做法**：

```
删除组件时，同步清理：
1. 导入语句
2. 相关状态
3. 相关函数
4. 相关类型定义
5. 相关注释
```

---

## 🔗 相关文档

- [意图识别](./intent-detection.md) - 如何路由到此工作流
- [重构文件工作流](./refactor-file.md) - 大范围修改使用重构模式
- [Figma MCP 集成规范](../reference/figma-mcp-integration.md) - API 调用细节
- [样式映射策略](../reference/style-mapping-strategy.md) - Token 匹配算法
- [错误处理策略](../reference/error-handling.md) - 异常情况处理
- [成功验收标准](../reference/success-criteria.md) - 质量评估标准
