# 意图识别与模式路由

本文档定义如何识别用户意图并路由到正确的工作模式。

## 目录

- [目标](#目标)
- [识别流程](#识别流程)
  - [阶段 1：解析 Figma URL](#阶段-1解析-figma-url)
  - [阶段 2：识别操作意图](#阶段-2识别操作意图)
  - [阶段 3：确认与补充信息](#阶段-3确认与补充信息)
  - [阶段 4：生成路径建议](#阶段-4生成路径建议)
- [模式路由](#模式路由)
- [上下文数据结构](#上下文数据结构)
- [完整示例](#完整示例)
  - [示例 1：明确意图 + 完整信息](#示例-1明确意图--完整信息)
  - [示例 2：仅提供 URL](#示例-2仅提供-url)
  - [示例 3：修改现有文件](#示例-3修改现有文件)
- [边界情况处理](#边界情况处理)
  - [情况 1：无效的 Figma URL](#情况-1无效的-figma-url)
  - [情况 2：nodeId 缺失](#情况-2nodeid-缺失)
  - [情况 3：路径格式错误](#情况-3路径格式错误)
- [相关文档](#相关文档)

---

## 🎯 目标

根据用户输入确定：
1. 用户想做什么（新建页面/组件/修改文件/重构文件）
2. 需要处理哪个 Figma 设计
3. 目标文件路径
4. 是否需要额外确认

---

## 📝 识别流程

### 阶段 1：解析 Figma URL

用户可能提供以下格式的 URL：

#### 格式 A：设计文件 + 节点
```
https://figma.com/design/{fileKey}/{fileName}?node-id={nodeId}
```

**解析步骤**：
1. 提取 `fileKey`
2. 提取 `node-id` 参数
3. 将 `node-id` 中的 `-` 转换为 `:`（例如：`123-456` → `123:456`）

**示例**：
```
输入：https://figma.com/design/abc123/MyDesign?node-id=10-20
输出：
  fileKey: abc123
  nodeId: 10:20
```

#### 格式 B：分支文件
```
https://figma.com/design/{fileKey}/branch/{branchKey}/{fileName}?node-id={nodeId}
```

**处理**：
- 使用 `branchKey` 作为 `fileKey`

**示例**：
```
输入：https://figma.com/design/abc/branch/xyz/MyBranch?node-id=10-20
输出：
  fileKey: xyz  (使用 branchKey)
  nodeId: 10:20
```

#### 格式 C：FigJam 文件
```
https://figma.com/board/{fileKey}/{fileName}
```

**处理**：
- 调用 `mcp_figma_get_figjam` 而不是 `get_design_context`

---

### 阶段 2：识别操作意图

根据用户描述和上下文，判断用户想做什么。

#### 触发词识别

| 工作模式 | 触发词示例 | 关键特征 |
|---------|----------|---------|
| **新建页面** | "创建页面"、"新增页面"、"生成页面"、"根据设计创建" | 提到"页面"，没有指定现有文件 |
| **新建组件** | "创建组件"、"新建组件"、"生成组件"、"提取组件" | 提到"组件"，没有指定现有文件 |
| **修改文件** | "修改"、"更新"、"调整"、"在 XXX 文件中" | 指定了具体文件路径 |
| **重构文件** | "重构"、"重写"、"完全替换"、"覆盖" | 明确要求大范围改动 |

#### 意图识别算法

```typescript
function detectIntent(userInput: string, context: Context) {
  const input = userInput.toLowerCase();
  
  // 检查是否指定了文件
  const hasTargetFile = 
    context.currentFile ||  // 用户在编辑器中打开了文件
    /在\s*\S+\s*文件/.test(input) ||  // "在 XXX 文件"
    /修改\s*\S+/.test(input);  // "修改 XXX"
  
  // 检查关键词
  const mentions = {
    page: /页面|page/.test(input),
    component: /组件|component/.test(input),
    modify: /修改|更新|调整|改|优化/.test(input),
    refactor: /重构|重写|替换|覆盖/.test(input),
    create: /创建|新建|新增|生成|搭建|实现/.test(input)
  };
  
  // 判断逻辑
  if (mentions.refactor && hasTargetFile) {
    return 'refactor-file';
  }
  
  if (mentions.modify && hasTargetFile) {
    return 'modify-file';
  }
  
  if (mentions.page || input.includes('src/pages/')) {
    return 'new-page';
  }
  
  if (mentions.component || input.includes('src/components/')) {
    return 'new-component';
  }
  
  // 默认：如果有 Figma URL 但没明确意图，询问用户
  return 'unknown';
}
```

---

### 阶段 3：确认与补充信息

根据识别结果，可能需要向用户询问更多信息。

#### 情况 A：意图不明确

```typescript
if (intent === 'unknown') {
  const choice = await askUser(
    "请确认你想要：",
    [
      'A. 创建新页面',
      'B. 创建新组件',
      'C. 修改现有文件（请指定文件路径）',
      'D. 重构现有文件（请指定文件路径）'
    ]
  );
  
  switch (choice) {
    case 'A': intent = 'new-page'; break;
    case 'B': intent = 'new-component'; break;
    case 'C': 
      const modifyPath = await askUser("请提供文件路径：");
      intent = 'modify-file';
      context.targetPath = modifyPath;
      break;
    case 'D':
      const refactorPath = await askUser("请提供文件路径：");
      intent = 'refactor-file';
      context.targetPath = refactorPath;
      break;
  }
}
```

#### 情况 B：缺少目标路径

```typescript
if ((intent === 'new-page' || intent === 'new-component') && !context.targetPath) {
  console.info(`识别到意图：${intent === 'new-page' ? '创建新页面' : '创建新组件'}`);
  
  // 智能推荐路径
  const suggestedPath = generateSuggestedPath(figmaNodeName, intent);
  
  console.info(`建议路径：${suggestedPath}`);
  
  const choice = await askUser(
    "请确认文件路径：",
    [
      `A. 使用建议路径：${suggestedPath}`,
      'B. 自定义路径'
    ]
  );
  
  if (choice === 'A') {
    context.targetPath = suggestedPath;
  } else {
    context.targetPath = await askUser("请输入文件路径：");
  }
}
```

#### 情况 C：文件已存在

```typescript
if (intent === 'new-page' || intent === 'new-component') {
  const exists = await fileExists(context.targetPath);
  
  if (exists) {
    console.warn(`⚠️ 文件已存在：${context.targetPath}`);
    
    const choice = await askUser(
      "请选择操作：",
      [
        'A. 覆盖现有文件（会先创建备份）',
        'B. 合并内容',
        'C. 修改文件名',
        'D. 取消操作'
      ]
    );
    
    switch (choice) {
      case 'A': intent = 'refactor-file'; break;
      case 'B': intent = 'modify-file'; break;
      case 'C':
        const newPath = await askUser("请输入新的文件名：");
        context.targetPath = newPath;
        break;
      case 'D':
        return null;  // 取消
    }
  }
}
```

---

### 阶段 4：生成路径建议

根据 Figma 节点名称和意图，智能生成文件路径。

#### 规则

**页面**：
```typescript
function generatePagePath(nodeName: string): string {
  // 1. 转换为 PascalCase
  const componentName = toPascalCase(nodeName);
  // 例：user-list → UserList
  
  // 2. 生成路径
  return `src/pages/${componentName}/${componentName}.tsx`;
  // 结果：src/pages/UserList/UserList.tsx
}
```

**组件**：
```typescript
function generateComponentPath(nodeName: string): string {
  const componentName = toPascalCase(nodeName);
  
  // 判断是否为业务组件（包含 Form, Table, Modal 等）
  const isBusinessComponent = 
    /Form|Table|Modal|Dialog|Chart/.test(componentName);
  
  if (isBusinessComponent) {
    return `src/components/${componentName}/${componentName}.tsx`;
  } else {
    return `src/components/common/${componentName}.tsx`;
  }
}
```

**示例**：
```
Figma 节点名               意图         生成路径
-----------------------------------------------------------
user-list                 new-page     src/pages/UserList/UserList.tsx
search-form               new-comp     src/components/SearchForm/SearchForm.tsx
icon-button               new-comp     src/components/common/IconButton.tsx
sales-chart-modal         new-comp     src/components/SalesChartModal/SalesChartModal.tsx
```

---

## 🔀 模式路由

确认意图后，路由到对应的工作流程。

```typescript
async function route(intent: string, context: Context) {
  console.info(`\n✅ 意图确认：${getIntentLabel(intent)}`);
  console.info(`   设计文件：${context.fileKey}`);
  console.info(`   节点 ID：${context.nodeId}`);
  console.info(`   目标路径：${context.targetPath}`);
  console.info('');
  
  // 最终确认
  const confirm = await askUser(
    "确认开始处理？",
    ['Y. 确认', 'N. 取消', 'E. 编辑信息']
  );
  
  if (confirm === 'N') {
    console.info('已取消');
    return;
  }
  
  if (confirm === 'E') {
    // 允许用户修改信息
    context = await editContext(context);
  }
  
  // 路由到对应工作流
  switch (intent) {
    case 'new-page':
      return await executeNewPageWorkflow(context);
    case 'new-component':
      return await executeNewComponentWorkflow(context);
    case 'modify-file':
      return await executeModifyFileWorkflow(context);
    case 'refactor-file':
      return await executeRefactorFileWorkflow(context);
  }
}

function getIntentLabel(intent: string): string {
  const labels = {
    'new-page': '创建新页面',
    'new-component': '创建新组件',
    'modify-file': '修改现有文件',
    'refactor-file': '重构现有文件'
  };
  return labels[intent] || intent;
}
```

---

## 📊 上下文数据结构

```typescript
interface WorkflowContext {
  // Figma 信息
  fileKey: string;           // Figma 文件 Key
  nodeId: string;            // 节点 ID
  nodeName?: string;         // 节点名称（从 Figma 获取）
  
  // 意图信息
  intent: WorkflowIntent;    // 'new-page' | 'new-component' | 'modify-file' | 'refactor-file'
  
  // 目标文件
  targetPath: string;        // 目标文件路径
  targetExists: boolean;     // 文件是否已存在
  
  // 用户输入
  originalInput: string;     // 用户原始输入
  
  // 附加选项
  options?: {
    skipConfirmation?: boolean;  // 跳过确认（自动化场景）
    autoBackup?: boolean;        // 自动备份（修改/重构时）
    dryRun?: boolean;            // 预览模式（不实际写入文件）
  };
}
```

---

## ✅ 完整示例

### 示例 1：明确意图 + 完整信息

**用户输入**：
```
根据这个设计创建用户列表页面：
https://figma.com/design/abc123/App?node-id=10-20
路径：src/pages/UserList/UserList.tsx
```

**处理流程**：
```typescript
// 阶段 1：解析 URL
fileKey = 'abc123'
nodeId = '10:20'

// 阶段 2：识别意图
mentions.page = true  // 包含"页面"
intent = 'new-page'   // 识别为创建页面

// 阶段 3：确认路径
targetPath = 'src/pages/UserList/UserList.tsx'  // 用户已提供
fileExists = false

// 阶段 4：路由
route('new-page', context)
```

**输出**：
```
✅ 意图确认：创建新页面
   设计文件：abc123
   节点 ID：10:20
   目标路径：src/pages/UserList/UserList.tsx

确认开始处理？[Y/N/E]
```

---

### 示例 2：仅提供 URL

**用户输入**：
```
https://figma.com/design/xyz789/App?node-id=50-60
```

**处理流程**：
```typescript
// 阶段 1：解析 URL
fileKey = 'xyz789'
nodeId = '50:60'

// 阶段 2：识别意图
intent = 'unknown'  // 无明确关键词

// 阶段 3：询问用户
> 请确认你想要：
> A. 创建新页面
> B. 创建新组件
> C. 修改现有文件
> D. 重构现有文件
用户选择：A

intent = 'new-page'

// 阶段 4：获取节点名称
nodeName = await getFigmaNodeName('xyz789', '50:60')
// 假设返回 "checkout-page"

// 阶段 5：生成路径建议
suggestedPath = 'src/pages/CheckoutPage/CheckoutPage.tsx'

> 建议路径：src/pages/CheckoutPage/CheckoutPage.tsx
> A. 使用建议路径
> B. 自定义路径
用户选择：A

targetPath = suggestedPath

// 阶段 6：路由
route('new-page', context)
```

---

### 示例 3：修改现有文件

**用户输入**：
```
根据这个设计修改 src/pages/Dashboard/Dashboard.tsx：
https://figma.com/design/def456/App?node-id=100-200
```

**处理流程**：
```typescript
// 阶段 1：解析 URL
fileKey = 'def456'
nodeId = '100:200'

// 阶段 2：识别意图
mentions.modify = true  // 包含"修改"
hasTargetFile = true    // 提供了文件路径
intent = 'modify-file'

// 阶段 3：确认文件存在
targetPath = 'src/pages/Dashboard/Dashboard.tsx'
fileExists = true  // 文件存在

// 阶段 4：路由
route('modify-file', context)
```

---

## 🚫 边界情况处理

### 情况 1：无效的 Figma URL

```typescript
const urlPattern = /figma\.com\/(design|board)\/[^\/]+/;

if (!urlPattern.test(userInput)) {
  console.error('❌ 未检测到有效的 Figma URL');
  console.error('');
  console.error('支持的格式：');
  console.error('- https://figma.com/design/{fileKey}/{fileName}?node-id={nodeId}');
  console.error('- https://figma.com/board/{fileKey}/{fileName}');
  console.error('');
  console.error('请提供有效的 Figma 设计链接');
  return;
}
```

### 情况 2：nodeId 缺失

```typescript
if (!nodeId) {
  console.warn('⚠️ URL 中未包含 node-id 参数');
  console.warn('');
  console.warn('获取方法：');
  console.warn('1. 在 Figma 中右键点击目标节点');
  console.warn('2. 选择 "Copy/Paste as" → "Copy link"');
  console.warn('3. 粘贴完整链接（包含 node-id）');
  
  const manualNodeId = await askUser('或手动输入 node-id：');
  nodeId = manualNodeId.replace('-', ':');
}
```

### 情况 3：路径格式错误

```typescript
const validPathPattern = /^src\/(pages|components)\/[\w\/]+\.tsx$/;

if (!validPathPattern.test(targetPath)) {
  console.warn(`⚠️ 路径格式可能不正确：${targetPath}`);
  console.warn('');
  console.warn('标准格式：');
  console.warn('- 页面：src/pages/{Name}/{Name}.tsx');
  console.warn('- 组件：src/components/{Name}/{Name}.tsx');
  console.warn('');
  
  const choice = await askUser(
    '继续使用此路径？',
    ['Y. 是（我确认这是正确的）', 'N. 否（让我修改）']
  );
  
  if (choice === 'N') {
    targetPath = await askUser('请输入正确的路径：');
  }
}
```

---

## 🔗 相关文档

- [新页面工作流](./new-page.md) - `new-page` 模式的详细流程
- [新组件工作流](./new-component.md) - `new-component` 模式的详细流程
- [修改文件工作流](./modify-file.md) - `modify-file` 模式的详细流程
- [重构文件工作流](./refactor-file.md) - `refactor-file` 模式的详细流程
