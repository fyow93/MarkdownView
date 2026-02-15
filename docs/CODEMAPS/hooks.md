# 🪝 Hooks Codemap

> Last Updated: 2025-01-26

本文档详细记录了项目中所有自定义 React Hooks 的架构、API 和使用方式。

## 📋 Hooks 概览

| Hook | 路径 | 描述 | 测试数 |
|------|------|------|--------|
| `useMarkdownLoader` | `src/hooks/useMarkdownLoader.ts` | Markdown内容加载、缓存、TOC生成 | 12 |
| `useScrollPosition` | `src/hooks/useScrollPosition.ts` | 滚动位置追踪、返回顶部 | 8 |
| `useKeyboardShortcuts` | `src/hooks/useKeyboardShortcuts.ts` | 键盘快捷键处理 | 11 |
| `useToc` | `src/hooks/useToc.ts` | 目录生成和滚动高亮 | - |
| `useSmoothScroll` | `src/hooks/useSmoothScroll.ts` | 平滑滚动功能 | - |
| `useCopilotSessions` | `src/hooks/useCopilotSessions.ts` | Copilot会话管理 | 5 |
| `useCopilotSessionWatch` | `src/hooks/useCopilotSessionWatch.ts` | Copilot会话实时监控 | 11 |
| `useFileWatch` | `src/hooks/useFileWatch.ts` | SSE文件变更监控 | 12 |

## 🏗️ 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Hooks Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Content Loading Hooks                   │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │            useMarkdownLoader                 │    │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │    │    │
│  │  │  │  fetch   │ │   LRU    │ │   TOC    │     │    │    │
│  │  │  │  content │ │  cache   │ │  parse   │     │    │    │
│  │  │  └────┬─────┘ └────┬─────┘ └────┬─────┘     │    │    │
│  │  │       └────────────┴────────────┘           │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              UI Interaction Hooks                    │    │
│  │  ┌──────────────────┐  ┌──────────────────────┐     │    │
│  │  │ useScrollPosition│  │ useKeyboardShortcuts │     │    │
│  │  │  - progress      │  │  - Home/End scroll   │     │    │
│  │  │  - showBackToTop │  │  - Ctrl+B TOC toggle │     │    │
│  │  │  - scrollToTop   │  │  - Ctrl+K search     │     │    │
│  │  └──────────────────┘  │  - Ctrl+R refresh    │     │    │
│  │                        │  - heading nav       │     │    │
│  │                        └──────────────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Navigation Hooks                        │    │
│  │  ┌──────────────┐  ┌────────────────────────────┐   │    │
│  │  │   useToc     │  │     useSmoothScroll        │   │    │
│  │  │  - items     │  │  - scrollToElement         │   │    │
│  │  │  - activeId  │  │  - scrollToPosition        │   │    │
│  │  └──────────────┘  └────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Session Management Hooks                │    │
│  │  ┌────────────────────┐  ┌──────────────────────┐   │    │
│  │  │ useCopilotSessions │  │useCopilotSessionWatch│   │    │
│  │  │  - sessions list   │  │  - real-time updates │   │    │
│  │  │  - CRUD operations │  │  - file watching     │   │    │
│  │  └────────────────────┘  └──────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              File Watch Hooks                        │    │
│  │  ┌────────────────────────────────────────────┐     │    │
│  │  │              useFileWatch                   │     │    │
│  │  │  - SSE connection to /api/file-watch       │     │    │
│  │  │  - onFileChanged callback                  │     │    │
│  │  │  - auto-reconnect on error                 │     │    │
│  │  └────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📘 useMarkdownLoader

**路径:** `src/hooks/useMarkdownLoader.ts`

### 功能描述
加载和缓存 Markdown 内容，生成目录 (TOC)，支持实时轮询更新。

### API

```typescript
interface UseMarkdownLoaderOptions {
  filename: string;
  realTimeEnabled?: boolean;
  pollingInterval?: number;
}

interface UseMarkdownLoaderReturn {
  content: string;
  isLoading: boolean;
  error: Error | null;
  toc: TocItem[];
  lastModified: number | null;
  refresh: () => Promise<void>;
}

function useMarkdownLoader(options: UseMarkdownLoaderOptions): UseMarkdownLoaderReturn;
```

### 内部实现

#### LRU 缓存
- 最大容量: 50 个条目
- 自动淘汰: 最少使用的条目
- 缓存键: 文件路径

#### TOC 生成
```typescript
interface TocItem {
  id: string;
  text: string;
  level: number;
}

// 标题 ID 生成规则
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')  // 保留 Unicode 字符
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
```

### 使用示例

```tsx
import { useMarkdownLoader } from '@/hooks';

function MarkdownPage({ filename }: { filename: string }) {
  const { content, isLoading, error, toc, refresh } = useMarkdownLoader({
    filename,
    realTimeEnabled: true,
    pollingInterval: 3000,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;

  return <MarkdownViewer content={content} toc={toc} />;
}
```

---

## 📘 useScrollPosition

**路径:** `src/hooks/useScrollPosition.ts`

### 功能描述
追踪滚动位置和进度，提供返回顶部功能。

> **Named Export Only** - 使用 `import { useScrollPosition } from '@/hooks'`

### API

```typescript
interface UseScrollPositionOptions {
  containerRef?: RefObject<HTMLElement | null>;
  threshold?: number;  // 显示返回顶部按钮的阈值 (默认: 200px)
}

interface UseScrollPositionResult {
  scrollProgress: number;  // 0-100
  showBackToTop: boolean;
  scrollToTop: () => void;
}

function useScrollPosition(options?: UseScrollPositionOptions): UseScrollPositionResult;
```

### 使用示例

```tsx
import { useScrollPosition } from '@/hooks';

// Basic usage with a container ref
function ContentArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollProgress, showBackToTop, scrollToTop } = useScrollPosition({
    containerRef,
    threshold: 300,
  });

  return (
    <div ref={containerRef}>
      {/* Display scroll progress */}
      <ProgressBar value={scrollProgress} />
      
      {/* Show back-to-top button when scrolled past threshold */}
      {showBackToTop && <BackToTopButton onClick={scrollToTop} />}
      <Content />
    </div>
  );
}
```

---

## 📘 useKeyboardShortcuts

**路径:** `src/hooks/useKeyboardShortcuts.ts`

### 功能描述
处理键盘快捷键，支持导航、搜索、刷新等操作。

### API

```typescript
interface KeyboardShortcutHandlers {
  onToggleToc?: () => void;
  onSearch?: () => void;
  onRefresh?: () => void;
  onNavigatePrevHeading?: () => void;
  onNavigateNextHeading?: () => void;
  containerRef?: RefObject<HTMLElement>;
}

function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void;
```

### 支持的快捷键

| 快捷键 | 功能 | 处理器 |
|--------|------|--------|
| `Home` | 滚动到顶部 | 内置 |
| `End` | 滚动到底部 | 内置 |
| `Ctrl+B` | 切换目录显示 | `onToggleToc` |
| `Ctrl+K` | 打开搜索 | `onSearch` |
| `Ctrl+R` | 刷新内容 | `onRefresh` |
| `Ctrl+↑` | 上一个标题 | `onNavigatePrevHeading` |
| `Ctrl+↓` | 下一个标题 | `onNavigateNextHeading` |

### 使用示例

```tsx
import { useKeyboardShortcuts } from '@/hooks';

function MarkdownViewer() {
  const [showToc, setShowToc] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcuts({
    containerRef,
    onToggleToc: () => setShowToc(prev => !prev),
    onSearch: () => openSearchDialog(),
    onRefresh: () => refreshContent(),
  });

  return <div ref={containerRef}>...</div>;
}
```

---

## 📘 useToc

**路径:** `src/hooks/useToc.ts`

### 功能描述
从 Markdown 内容生成目录，追踪当前活动的标题。

### API

```typescript
interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface UseTocReturn {
  items: TocItem[];
  activeId: string | null;
}

function useToc(content: string, containerRef: RefObject<HTMLElement>): UseTocReturn;
```

---

## 📘 useCopilotSessions

**路径:** `src/hooks/useCopilotSessions.ts`

### 功能描述
管理 Copilot 会话列表，支持 CRUD 操作。

### API

```typescript
interface CopilotSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface UseCopilotSessionsReturn {
  sessions: CopilotSession[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  selectSession: (id: string) => void;
  currentSession: CopilotSession | null;
}
```

---

## 📘 useFileWatch

**路径:** `src/hooks/useFileWatch.ts`

### 功能描述
通过 Server-Sent Events (SSE) 监听文件变更，用于实现热重载和实时预览功能。

### API

```typescript
interface FileWatchEvent {
  type: 'file:changed' | 'file:deleted' | 'connected' | 'error';
  timestamp: number;
  data: {
    filePath?: string;
    lastModified?: string;
    message?: string;
  };
}

interface UseFileWatchOptions {
  enabled?: boolean;
  filePath?: string;
  onFileChanged?: (data: FileWatchEvent['data']) => void;
  onError?: (error: Error) => void;
}

interface UseFileWatchResult {
  isConnected: boolean;
  lastEvent: FileWatchEvent | null;
}

function useFileWatch(options: UseFileWatchOptions): UseFileWatchResult;
```

### 使用示例

```tsx
import { useFileWatch } from '@/hooks';

function LivePreview({ filePath }: { filePath: string }) {
  const { isConnected, lastEvent } = useFileWatch({
    enabled: true,
    filePath,
    onFileChanged: (data) => {
      console.log('File changed:', data.filePath);
      // 触发内容重新加载
      refreshContent();
    },
    onError: (error) => {
      console.error('SSE connection error:', error);
    },
  });

  return (
    <div>
      <ConnectionStatus isConnected={isConnected} />
      <MarkdownViewer content={content} />
    </div>
  );
}
```

### 内部实现
- 使用 `EventSource` 连接 `/api/file-watch` SSE 端点
- 支持自动重连（连接错误时）
- 使用 `useRef` 存储回调函数避免不必要的重连
- 组件卸载时自动关闭连接

---

## 🧪 测试覆盖

| Hook | 测试文件 | 测试数 | 覆盖率 |
|------|----------|--------|--------|
| useMarkdownLoader | `__tests__/useMarkdownLoader.test.ts` | 12 | 高 |
| useScrollPosition | `__tests__/useScrollPosition.test.ts` | 8 | 高 |
| useKeyboardShortcuts | `__tests__/useKeyboardShortcuts.test.ts` | 11 | 高 |
| useCopilotSessions | `__tests__/useCopilotSessions.test.ts` | 5 | 高 |
| useCopilotSessionWatch | `__tests__/useCopilotSessionWatch.test.ts` | 10 | 高 |
| useFileWatch | `__tests__/useFileWatch.test.ts` | 11 | 高 |
| useCopilotSessions | `__tests__/useCopilotSessions.test.ts` | 11 | 高 |
| useCopilotSessionWatch | `__tests__/useCopilotSessionWatch.test.ts` | 10 | 高 |

---

## 📚 相关链接

- [组件文档](frontend.md)
- [测试文档](testing.md)
- [项目 README](../../README.md)
