---
name: 'React 组件开发规范'
description: '这是一个针对 React 组件开发的规范指南，涵盖函数组件、Hooks、性能优化、类型安全等最佳实践。确保生成的 React 组件代码现代、高效、可维护。'
applyTo: "**/*.{tsx,jsx}"
---

# React 组件开发规范

## 核心原则

- **单一职责**：每个组件只负责一个功能
- **组合优于继承**：使用组合模式构建复杂 UI
- **声明式编程**：描述「是什么」而非「怎么做」
- **不可变数据**：避免直接修改 state 和 props

## 组件类型和结构

### 1. 函数组件（首选）

```tsx
// ✅ 推荐：使用 TypeScript + 函数组件
interface UserCardProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  onEdit?: (id: string) => void;
  className?: string;
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
  const handleEdit = () => {
    onEdit?.(user.id);
  };

  return (
    <div className={cn('user-card', className)}>
      {user.avatar && <img src={user.avatar} alt={user.name} />}
      <h3>{user.name}</h3>
      {onEdit && (
        <button onClick={handleEdit}>编辑</button>
      )}
    </div>
  );
}
```

### 2. 组件文件结构

```
components/
  UserCard/
    UserCard.tsx           # 主组件
    UserCard.less          # 样式文件（或 UserCard.module.css）
    UserCard.stories.tsx   # Storybook 故事（可选）
    index.ts              # 导出文件
    types.ts              # 类型定义（复杂时独立）
```

### 3. 组件代码组织顺序

```tsx
export const Component = memo(({ title, variant = 'primary', onAction }: Props) => {
  // 1. Hooks（state, effects, context, custom hooks）
  const [isOpen, setIsOpen] = useState(false);
  
  // 2. 事件处理
  const handleClick = useCallback(() => {
    setIsOpen(true);
    onAction?.();
  }, [onAction]);
  
  // 3. 早期返回（loading, error）
  if (isLoading) return <LoadingSpinner />;
  
  // 4. 渲染
  return (
    <div className={`component--${variant}`}>
      <button onClick={handleClick}>操作</button>
    </div>
  );
});
Component.displayName = 'Component';
```

## Hooks 使用规范

### 1. useState - 状态管理

```tsx
// ✅ 使用函数式更新
const [count, setCount] = useState(0);
setCount(prev => prev + 1);

// ✅ 复杂状态使用 useReducer
type Action = { type: 'SET_NAME'; payload: string } | { type: 'SET_AGE'; payload: number };
const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'SET_NAME': return { ...state, name: action.payload };
    case 'SET_AGE': return { ...state, age: action.payload };
    default: return state;
  }
};
const [state, dispatch] = useReducer(reducer, initialState);
```

### 2. useEffect - 副作用管理

```tsx
// ✅ 正确的依赖数组和清理函数
useEffect(() => {
  const subscription = api.subscribe(userId);
  return () => subscription.unsubscribe();
}, [userId]);

// ✅ 分离不同的副作用
useEffect(() => { /* 副作用 A */ }, [depA]);
useEffect(() => { /* 副作用 B */ }, [depB]);

// ✅ 封装复杂逻辑到自定义 Hook
function useUserData(userId: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let cancelled = false;
    api.fetchUser(userId).then(result => {
      if (!cancelled) { setData(result); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [userId]);
  
  return { data, loading };
}
```

### 3. useMemo 和 useCallback - 性能优化

```tsx
// ✅ 推荐：缓存昂贵的计算
const expensiveValue = useMemo(() => {
  return items.reduce((acc, item) => {
    // 复杂计算
    return acc + item.value;
  }, 0);
}, [items]);

// ✅ 推荐：缓存回调函数（传递给子组件时）
const handleItemClick = useCallback((id: string) => {
  setSelectedId(id);
  onSelect?.(id);
}, [onSelect]);

// ❌ 避免：过度使用（简单计算不需要）
const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);
// 应该直接：const fullName = `${firstName} ${lastName}`;
```

### 4. useRef - 引用值和 DOM

```tsx
// ✅ 访问 DOM 元素
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();

// ✅ 存储不触发重渲染的值
const intervalRef = useRef<number>();

// ✅ 使用 forwardRef 暴露 ref
export const CustomInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => <input ref={ref} className={className} {...props} />
);
```

### 5. 自定义 Hooks

```tsx
// ✅ 提取可复用逻辑
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  const setStoredValue = useCallback((newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  }, [key]);

  return [value, setStoredValue] as const;
}
```

## TypeScript 类型定义

### 1. Props 类型

```tsx
// ✅ 推荐：使用 interface 定义 Props
interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

// ✅ 推荐：继承 HTML 属性
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// ✅ 推荐：使用泛型
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  renderOption: (option: T) => ReactNode;
}
```

### 2. 事件处理类型

```tsx
// ✅ 推荐：明确事件类型
const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
};

const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
  setValue(event.target.value);
};

const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
};
```

### 3. Ref 类型

```tsx
// ✅ 推荐：正确的 ref 类型
const inputRef = useRef<HTMLInputElement>(null);
const divRef = useRef<HTMLDivElement>(null);
const customRef = useRef<CustomComponentHandle>(null);
```

## 性能优化

### 1. React.memo - 避免不必要的重渲染

```tsx
// ✅ 推荐：对展示型组件使用 memo
export const UserCard = memo(({ user }: UserCardProps) => {
  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
});

// ✅ 推荐：自定义比较函数
export const ExpensiveComponent = memo(
  ({ data }: Props) => {
    return <div>{/* 复杂渲染 */}</div>;
  },
  (prevProps, nextProps) => {
    // 返回 true 表示不需要重渲染
    return prevProps.data.id === nextProps.data.id;
  }
);
```

### 2. 列表渲染优化

```tsx
// ✅ 使用稳定的 key
{items.map(item => <ListItem key={item.id} item={item} />)}

// ❌ 避免使用索引作为 key
{items.map((item, index) => <ListItem key={index} item={item} />)}
```

### 3. 代码分割和懒加载

```tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}
```

## 状态管理

```tsx
// ✅ 本地状态：组件内部使用
const [count, setCount] = useState(0);

// ✅ 提升状态：多个组件共享
function Parent() {
  const [filter, setFilter] = useState('all');
  return (
    <>
      <FilterBar value={filter} onChange={setFilter} />
      <ItemList filter={filter} />
    </>
  );
}

// ✅ Context：跨多层级共享
const ThemeContext = createContext<Theme>('light');

// ✅ Zustand：轻量全局状态管理
import { create } from 'zustand';

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
}));

// 使用
const user = useUserStore(state => state.user);
```

## 错误处理

```tsx
// ✅ Error Boundary
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>出错了</div>;
    }
    return this.props.children;
  }
}

// ✅ 异步错误处理
function UserProfile({ userId }: { userId: string }) {
  const [data, setData] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fetchUser(userId)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <NotFound />;
  return <UserDetails user={data} />;
}
```

## 样式方案

```tsx
// ✅ Less（推荐）
// UserCard.less
.user-card {
  padding: 16px;
  .title { font-size: 1.5rem; }
  &:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
  &.highlighted { background: #f0f0f0; }
}

// UserCard.tsx
import './UserCard.less';
import classNames from 'classnames';

export function UserCard({ title, highlighted, className }: Props) {
  return (
    <div className={classNames('user-card', { highlighted }, className)}>
      <h3 className="title">{title}</h3>
    </div>
  );
}

// ✅ Emotion/Styled
import styled from '@emotion/styled';
import { css } from '@emotion/react';

const Card = styled.div<{ highlighted?: boolean }>`
  padding: 16px;
  background: ${props => props.highlighted ? '#f0f0f0' : '#fff'};
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const Title = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
`;

export function UserCard({ title, highlighted }: Props) {
  return (
    <Card highlighted={highlighted}>
      <Title>{title}</Title>
    </Card>
  );
}
```

## 常见模式和反模式

```tsx
// ✅ 组合组件模式
function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}
Card.Header = ({ children }: { children: ReactNode }) => <div className="card-header">{children}</div>;
Card.Body = ({ children }: { children: ReactNode }) => <div className="card-body">{children}</div>;

// 使用
<Card>
  <Card.Header>标题</Card.Header>
  <Card.Body>内容</Card.Body>
</Card>

// ❌ 在渲染中创建函数
<button onClick={() => doSomething(id)}>点击</button>  // 不好
const handleClick = useCallback(() => doSomething(id), [id]);  // 好
<button onClick={handleClick}>点击</button>

// ❌ 过度使用 Context
<AppContext.Provider value={{ user, theme, settings, ... }}>  // 不好
// 应按关注点分离：
<UserContext.Provider>
  <ThemeContext.Provider>
```

## 总结

遵循这些规范，可以编写现代化、高性能的 React 组件，保持代码一致性和可维护性。规范是指导方针，需根据项目实际情况灵活调整。
