# 重构文件工作流

本文档定义如何根据 Figma 设计完全重构现有文件，适用于大范围改动或重大设计变更。

## 目录

- [适用场景](#适用场景)
- [风险提示](#风险提示)
- [准备检查](#准备检查)
  - [前置条件](#前置条件)
  - [影响分析](#影响分析)
- [执行流程](#执行流程)
  - [第 1 步：分析现有文件](#第-1-步分析现有文件)
  - [第 2 步：获取 Figma 新设计](#第-2-步获取-figma-新设计)
  - [第 3 步：制定重构策略](#第-3-步制定重构策略)
  - [第 4 步：创建备份（强制）](#第-4-步创建备份强制)
  - [第 5 步：提取需保留的代码](#第-5-步提取需保留的代码)
  - [第 6 步：生成新代码](#第-6-步生成新代码)
  - [第 7 步：迁移保留代码](#第-7-步迁移保留代码)
  - [第 8 步：TypeScript 类型检查](#第-8-步typescript-类型检查)
  - [第 9 步：代码质量检查](#第-9-步代码质量检查)
  - [第 10 步：替换原文件](#第-10-步替换原文件)
  - [第 11 步：彻底测试](#第-11-步彻底测试)
  - [第 12 步：更新依赖方（如需要）](#第-12-步更新依赖方如需要)
  - [第 13 步：生成重构报告](#第-13-步生成重构报告)
- [成功标准](#成功标准)
  - [核心标准（必须）](#核心标凅必须)
  - [次要标准（推荐）](#次要标凅推荐)
- [常见错误](#常见错误)
  - [错误 1：遗漏关键业务逻辑](#错误-1遗漏关键业务逻辑)
  - [错误 2：破坏向后兼容性](#错误-2破坏向后兼容性)
  - [错误 3：测试不充分](#错误-3测试不充分)
- [相关文档](#相关文档)

---

## 🎯 适用场景

- ✅ 设计大幅改变，与原实现差异显著
- ✅ 需要完全重写代码（保留少于 30% 原代码）
- ✅ 架构调整（如从类组件改为函数组件）
- ✅ 重大功能变更

---

## ⚠️ 风险提示

**重构是高风险操作，可能导致：**
- ❌ 破坏现有功能
- ❌ 引入新 bug
- ❌ 影响依赖此文件的其他模块

**建议**：
1. 确保有完整的测试覆盖（单元测试、集成测试）
2. 使用版本控制（Git），确保可回滚
3. 通知团队成员即将进行的重构
4. 在非关键时期进行（避免上线前夕）

---

## 📋 准备检查

### 前置条件

```markdown
- [ ] 已解析 Figma URL（fileKey + nodeId）
- [ ] 已确认目标文件路径
- [ ] 目标文件存在
- [ ] 已确认意图为"重构现有文件"
- [ ] 了解重构风险并决定继续
```

### 影响分析

```markdown
依赖关系：
- [ ] 已搜索引用此文件的其他模块
- [ ] 已评估破坏性影响（API 变化、导出变化）
- [ ] 已计划更新依赖方（如需要）

测试覆盖：
- [ ] 有单元测试（理想）
- [ ] 有集成测试（次优）
- [ ] 无测试（高风险，建议先编写测试）

版本控制：
- [ ] 当前分支干净（无未提交更改）
- [ ] 已创建重构专用分支
- [ ] 团队成员已知晓
```

---

## 🔄 执行流程

### 第 1 步：分析现有文件

**目标**：识别需要保留的核心逻辑。

**分析内容**：

#### A. 业务逻辑（通常需保留）
```markdown
- [ ] API 调用和数据获取
- [ ] 表单验证规则
- [ ] 计算逻辑
- [ ] 业务规则判断
```

#### B. 状态管理（评估保留）
```markdown
- [ ] 状态定义（可能需调整）
- [ ] 状态更新逻辑（可能需改写）
- [ ] 副作用处理（useEffect 等）
```

#### C. 事件处理（通常需保留）
```markdown
- [ ] 点击处理
- [ ] 表单提交
- [ ] 数据操作（增删改查）
```

#### D. 工具函数（通常需保留）
```markdown
- [ ] 数据格式化
- [ ] 验证函数
- [ ] 辅助计算
```

#### E. UI 层（通常需重写）
```markdown
- [ ] 组件结构（大概率重写）
- [ ] 样式定义（重写）
- [ ] 布局逻辑（根据新设计重写）
```

**输出保留清单**：
```typescript
需要保留：
1. 业务逻辑
   - fetchUserData() - API 调用
   - validateForm() - 表单验证
   - calculateTotal() - 金额计算

2. 工具函数
   - formatDate() - 日期格式化
   - filterData() - 数据过滤

3. 类型定义
   - UserData 接口
   - FormValues 接口

需要重写：
1. UI 结构（完全不同的设计）
2. 样式定义（新设计系统）
3. 组件拆分（新的组件层次）
```

---

### 第 2 步：获取 Figma 新设计

**调用**：
```typescript
mcp_figma_get_design_context({
  fileKey: '...',
  nodeId: '...'
})
```

**详细规范**：参考 [Figma MCP 集成规范](../reference/figma-mcp-integration.md)

---

### 第 3 步：制定重构策略

**策略 A：完全重写（推荐）**
**适用**：设计差异 >70%

**步骤**：
1. 提取需保留的代码片段（业务逻辑、工具函数）
2. 按新页面/新组件工作流生成全新代码
3. 将保留的代码片段迁移到新代码中
4. 备份原文件
5. 替换为新代码

**优点**：
- ✅ 代码更清晰（无历史包袱）
- ✅ 完全符合新设计
- ✅ 易于应用新架构（如 Hooks）

**缺点**：
- ❌ 工作量大
- ❌ 风险高（可能遗漏逻辑）

---

**策略 B：增量重构**
**适用**：设计差异 30-70%

**步骤**：
1. 先修改 UI 层（组件结构、样式）
2. 保持业务逻辑不变
3. 逐步优化逻辑层（可选）

**优点**：
- ✅ 风险相对较小
- ✅ 可分步验证

**缺点**：
- ❌ 可能保留历史包袱
- ❌ 代码一致性较差

---

**选择策略**：
```
设计差异评估：

原设计：单栏布局 + 表格 + 简单筛选
新设计：双栏布局 + 卡片 + 高级筛选 + 导出

差异度：约 75%

建议：策略 A（完全重写）

继续？
[Y] 是，完全重写
[N] 否，改为增量重构
[C] 取消
```

---

### 第 4 步：创建备份（强制）

**重构必须先备份原文件。**

**操作**：
```typescript
const backupPath = `${targetPath}.backup-${Date.now()}`;
await copyFile(targetPath, backupPath);

console.info(`✅ 已创建备份：${backupPath}`);
console.info(`⚠️ 重构完成后，请彻底测试再删除备份`);
```

**Git 备份**：
```bash
# 推荐：提交当前版本
git add src/pages/UserList/UserList.tsx
git commit -m "备份：重构前的 UserList"

# 创建重构分支
git checkout -b refactor/user-list
```

---

### 第 5 步：提取需保留的代码

**将保留的代码片段暂存。**

**提取方式**：

#### A. 提取业务逻辑函数
```typescript
// 从原文件提取
const businessLogic = `
async function fetchUserData(userId: string) {
  const response = await api.get(\`/users/\${userId}\`);
  return response.data;
}

function validateForm(values: FormValues) {
  if (!values.name) return '姓名不能为空';
  if (!values.email) return '邮箱不能为空';
  return null;
}
`;
```

#### B. 提取类型定义
```typescript
const typeDefinitions = `
interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface FormValues {
  name: string;
  email: string;
}
`;
```

#### C. 提取工具函数
```typescript
const utilityFunctions = `
function formatDate(date: Date) {
  return dayjs(date).format('YYYY-MM-DD');
}

function filterActiveUsers(users: UserData[]) {
  return users.filter(u => u.status === 'active');
}
`;
```

---

### 第 6 步：生成新代码

**按新页面/新组件工作流生成代码。**

**参考**：
- [新页面工作流](./new-page.md) - 如果是页面文件
- [新组件工作流](./new-component.md) - 如果是组件文件

**关键要点**：
1. 完全基于新设计生成
2. 使用最新的最佳实践（Hooks、TypeScript、Token）
3. 遵循项目代码规范

---

### 第 7 步：迁移保留代码

**将第 5 步提取的代码集成到新代码中。**

#### 迁移清单：

```markdown
1. 类型定义
   - [ ] 复制到新文件顶部（import 之后）
   - [ ] 检查是否与新定义冲突
   - [ ] 合并重复定义

2. 业务逻辑函数
   - [ ] 复制到新文件
   - [ ] 调整函数签名（如需要）
   - [ ] 确保函数在正确位置被调用

3. 工具函数
   - [ ] 复制到新文件（或独立工具文件）
   - [ ] 验证依赖是否完整

4. 常量和配置
   - [ ] 复制到新文件
   - [ ] 检查是否需要更新

5. 副作用（useEffect）
   - [ ] 识别哪些副作用需要保留
   - [ ] 重新实现（可能需要调整依赖）
```

**示例**：
```typescript
// 新生成的代码
export default function UserList() {
  const [users, setUsers] = useState<UserData[]>([]);
  
  // ✅ 迁移：保留原来的数据获取逻辑
  useEffect(() => {
    fetchUserData().then(setUsers);
  }, []);
  
  // ✅ 迁移：保留原来的表单验证
  const handleSubmit = (values: FormValues) => {
    const error = validateForm(values);
    if (error) {
      showError(error);
      return;
    }
    // 提交逻辑
  };
  
  // 新的 UI（基于 Figma 设计）
  return (
    <div css={containerStyles}>
      {/* 新设计的 UI */}
    </div>
  );
}

// ✅ 迁移：业务逻辑函数（从原文件复制）
async function fetchUserData() {
  const response = await api.get('/users');
  return response.data;
}

function validateForm(values: FormValues) {
  if (!values.name) return '姓名不能为空';
  if (!values.email) return '邮箱不能为空';
  return null;
}

// ✅ 迁移：类型定义（从原文件复制）
interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}
```

---

### 第 8 步：TypeScript 类型检查

**全面验证**：
```bash
tsc --noEmit
```

**处理错误**：参考 [错误处理策略](../reference/error-handling.md#c1typescript-类型错误)

**目标**：0 errors, 0 warnings

---

### 第 9 步：代码质量检查

**ESLint + Prettier**：
```bash
npm run lint
npm run format
```

---

### 第 10 步：替换原文件

**操作**：
```typescript
// 备份已在第 4 步完成
await writeFile(targetPath, newCode);

console.info(`✅ 文件已替换：${targetPath}`);
console.info(`⚠️ 备份位置：${backupPath}`);
```

---

### 第 11 步：彻底测试

**测试清单**（比修改文件更严格）：

```markdown
1. 单元测试
   - [ ] 运行所有相关单元测试
   - [ ] 通过率 100%
   - [ ] 覆盖率不下降

2. 功能测试
   - [ ] 页面/组件正常渲染
   - [ ] 所有交互功能正常
   - [ ] 数据加载/提交正常
   - [ ] 边界情况处理正确

3. 集成测试
   - [ ] 与依赖此文件的模块集成正常
   - [ ] API 调用正常
   - [ ] 路由跳转正常

4. 回归测试
   - [ ] 原有功能全部保留
   - [ ] 无新增 bug
   - [ ] 性能不下降

5. 视觉测试
   - [ ] 对比 Figma 设计
   - [ ] 视觉还原度 ≥95%
   - [ ] 响应式布局正确

6. 可访问性测试
   - [ ] 键盘可操作
   - [ ] 屏幕阅读器兼容
   - [ ] ARIA 标签正确
```

---

### 第 12 步：更新依赖方（如需要）

**如果文件的导出 API 发生变化，需要更新依赖方。**

#### 识别依赖：
```bash
# 搜索引用此文件的其他文件
grep -r "from './UserList'" src/
grep -r "from '@/pages/UserList'" src/
```

#### 更新示例：
```typescript
// 原文件导出（类组件）
export default class UserList extends Component { ... }

// 新文件导出（函数组件）
export default function UserList(props: UserListProps) { ... }

// 依赖方无需修改（导出兼容）
import UserList from '@/pages/UserList';
<UserList />  // ✅ 正常工作
```

**如果 Props 变化**：
```typescript
// 原 Props
interface OldProps {
  userId: string;
}

// 新 Props（不兼容）
interface NewProps {
  user: UserData;  // 从 userId 改为完整 user 对象
}

// 需要更新所有调用方
- <UserList userId="123" />
+ <UserList user={userData} />
```

---

### 第 13 步：生成重构报告

**输出**：
```markdown
✅ 文件重构完成

文件：src/pages/UserList/UserList.tsx
备份：src/pages/UserList/UserList.tsx.backup-1701234567890

重构摘要：
- 原文件：450 行（类组件 + 行内样式）
- 新文件：320 行（函数组件 + Emotion + Token）
- 代码减少：28%

保留内容：
1. 业务逻辑 (5 个函数)
   - fetchUserData
   - validateForm
   - calculateTotal
   - filterUsers
   - formatData

2. 类型定义 (3 个接口)
   - UserData
   - FormValues
   - FilterConfig

3. 常量配置
   - API_ENDPOINTS
   - DEFAULT_PAGE_SIZE

新增内容：
1. UI 完全重写（基于新设计）
2. 使用 Hooks 替代类组件
3. 100% 使用 Token
4. 新增导出功能
5. 新增高级筛选

移除内容：
- 旧的 Sidebar 组件
- 废弃的 table 样式
- 未使用的 helper 函数

验证结果：
- TypeScript: ✅ 0 errors
- ESLint: ✅ 0 errors
- 单元测试: ✅ 18/18 passed
- 功能测试: ✅ 全部通过
- 视觉对比: ✅ 97% 还原度

性能对比：
- 首次渲染：1.2s → 0.8s (提升 33%)
- 包大小：+12KB（新增功能）

依赖影响：
- 引用此文件的模块：3 个
- 需要更新的模块：0 个（API 兼容）

建议：
1. 彻底测试所有功能
2. 监控生产环境表现
3. 一周后删除备份文件（如无问题）
4. 更新相关文档（如有）

风险提示：
⚠️ 虽然所有测试通过，但仍建议：
- 密切关注用户反馈
- 监控错误日志
- 准备快速回滚方案（使用备份）
```

---

## ✅ 成功标准

重构成功需满足：

### 核心标准（必须）
- ✅ TypeScript 类型检查 0 错误
- ✅ 所有单元测试通过
- ✅ 所有功能测试通过
- ✅ 原有功能 100% 保留
- ✅ 视觉还原度 ≥95%

### 次要标准（推荐）
- ✅ 代码质量提升（行数减少、可读性提高）
- ✅ Token 使用率 ≥90%
- ✅ 性能不下降（甚至提升）
- ✅ 依赖方无需修改（API 兼容）

**详细评判标准**：参考 [成功验收标准](../reference/success-criteria.md)

---

## 🚫 常见错误

### 错误 1：遗漏关键业务逻辑

**症状**：重构后某个功能不工作了

**原因**：在提取保留代码时遗漏了某个函数或副作用

**预防**：
```markdown
重构前：
1. 列出所有函数（包括 useEffect）
2. 逐个标记"保留"或"重写"
3. 逐个迁移"保留"的函数
4. 逐个验证"保留"的函数是否正常工作
```

### 错误 2：破坏向后兼容性

**症状**：依赖此文件的其他模块报错

**原因**：导出的 API 发生变化（Props 变化、导出名称变化）

**预防**：
```markdown
重构前：
1. 搜索所有引用此文件的地方
2. 记录当前的 Props 接口
3. 确保新 Props 兼容旧 Props（或更新所有调用方）
```

### 错误 3：测试不充分

**症状**：上线后发现 bug

**原因**：重构后没有进行彻底测试

**预防**：
```markdown
重构后必须执行：
1. 所有自动化测试（单元、集成）
2. 手动功能测试（覆盖所有交互）
3. 边界情况测试
4. 回归测试（确保不影响其他功能）
5. 性能测试（确保无性能下降）
```

---

## 🔗 相关文档

- [意图识别](./intent-detection.md) - 如何路由到此工作流
- [修改文件工作流](./modify-file.md) - 小范围改动使用修改模式
- [新页面工作流](./new-page.md) - 重构时生成新代码参考
- [新组件工作流](./new-component.md) - 重构组件时参考
- [Figma MCP 集成规范](../reference/figma-mcp-integration.md) - API 调用细节
- [样式映射策略](../reference/style-mapping-strategy.md) - Token 匹配算法
- [错误处理策略](../reference/error-handling.md) - 异常情况处理
- [成功验收标准](../reference/success-criteria.md) - 质量评估标准
