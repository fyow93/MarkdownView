# 🎨 Frontend Components Codemap

> Last Updated: 2025-01-26

本文档详细记录了项目中所有前端组件的架构、API 和使用方式。

## 📋 组件概览

### UI 组件 (shadcn/ui)

| 组件 | 路径 | 描述 |
|------|------|------|
| `Button` | `src/components/ui/button.tsx` | 按钮组件 |
| `Card` | `src/components/ui/card.tsx` | 卡片容器 |
| `Dialog` | `src/components/ui/dialog.tsx` | 对话框 |
| `Badge` | `src/components/ui/badge.tsx` | 标签徽章 |
| `ScrollArea` | `src/components/ui/scroll-area.tsx` | 滚动区域 |
| `Separator` | `src/components/ui/separator.tsx` | 分隔线 |
| `Resizable` | `src/components/ui/resizable.tsx` | 可调整大小面板 |

### 业务组件

| 组件 | 路径 | 描述 | 测试数 |
|------|------|------|--------|
| `MarkdownViewer` | `src/components/MarkdownViewer.tsx` | 核心Markdown渲染器 | - |
| `FileTree` | `src/components/FileTree.tsx` | 文件树导航 | - |
| `FileTabs` | `src/components/FileTabs.tsx` | 文件标签页 | - |
| `DirectorySelector` | `src/components/DirectorySelector.tsx` | 目录选择器 | - |
| `ThemeToggle` | `src/components/ThemeToggle.tsx` | 主题切换 | - |
| `LanguageToggle` | `src/components/LanguageToggle.tsx` | 语言切换 | - |
| `ErrorBoundary` | `src/components/ErrorBoundary.tsx` | 错误边界 | - |

### Markdown 组件

| 组件 | 路径 | 描述 | 测试数 |
|------|------|------|--------|
| `CodeBlock` | `src/components/markdown/CodeBlock.tsx` | 代码块渲染 | - |
| `HeadingComponent` | `src/components/markdown/HeadingComponent.tsx` | 标题渲染 | - |
| `LeftSideToc` | `src/components/markdown/LeftSideToc.tsx` | 左侧目录 | - |
| `MermaidChart` | `src/components/markdown/MermaidChart.tsx` | Mermaid图表 | - |
| `StateComponents` | `src/components/markdown/StateComponents.tsx` | 状态组件 | 14 |
| `BackToTopButton` | `src/components/markdown/BackToTopButton.tsx` | 返回顶部 | 6 |
| `MarkdownHeader` | `src/components/markdown/MarkdownHeader.tsx` | Markdown头部/工具栏 | - |
| `MarkdownContent` | `src/components/markdown/MarkdownContent.tsx` | Markdown内容渲染 | - |

## 🏗️ 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                   Component Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   App Shell                          │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐   │    │
│  │  │ThemeProvider│  │LayoutClient│  │  Toaster   │   │    │
│  │  └──────┬──────┘  └──────┬──────┘  └────────────┘   │    │
│  │         └────────────────┼──────────────────────────│    │
│  └──────────────────────────┼──────────────────────────┘    │
│                             ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Main Layout                        │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │                 Header                        │   │    │
│  │  │ ┌─────────┐ ┌─────────┐ ┌─────────┐         │   │    │
│  │  │ │FileTree │ │ThemeToggle│ │LangToggle│        │   │    │
│  │  │ │ Button  │ │         │ │         │         │   │    │
│  │  │ └─────────┘ └─────────┘ └─────────┘         │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │              Content Area                     │   │    │
│  │  │  ┌────────┐  ┌────────────────────────────┐  │   │    │
│  │  │  │FileTree│  │      MarkdownViewer        │  │   │    │
│  │  │  │ Panel  │  │  ┌──────────────────────┐  │  │   │    │
│  │  │  │        │  │  │   MarkdownHeader     │  │  │   │    │
│  │  │  │        │  │  ├──────────────────────┤  │  │   │    │
│  │  │  │        │  │  │    MarkdownContent   │  │  │   │    │
│  │  │  │        │  │  │  ┌────────────────┐  │  │  │   │    │
│  │  │  │        │  │  │  │  ReactMarkdown │  │  │  │   │    │
│  │  │  │        │  │  │  │   CodeBlock    │  │  │  │   │    │
│  │  │  │        │  │  │  │ MermaidChart   │  │  │  │   │    │
│  │  │  │        │  │  │  └────────────────┘  │  │  │   │    │
│  │  │  │        │  │  ├──────────────────────┤  │  │   │    │
│  │  │  │        │  │  │   BackToTopButton    │  │  │   │    │
│  │  │  └────────┘  │  └──────────────────────┘  │  │   │    │
│  │  │              └────────────────────────────┘  │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📘 StateComponents

**路径:** `src/components/markdown/StateComponents.tsx`

### 功能描述
提供统一的状态显示组件，用于加载、错误、空内容和连接状态的展示。

### 导出组件

#### LoadingState
加载中状态显示。

```typescript
interface LoadingStateProps {
  message?: string;
  className?: string;
}

function LoadingState(props: LoadingStateProps): JSX.Element;
```

#### ErrorState
错误状态显示，支持重试。

```typescript
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

function ErrorState(props: ErrorStateProps): JSX.Element;
```

#### EmptyState
空内容状态显示。

```typescript
interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

function EmptyState(props: EmptyStateProps): JSX.Element;
```

#### ConnectionStatus
实时连接状态指示器。

```typescript
interface ConnectionStatusProps {
  isConnected: boolean;
  isRealTimeEnabled: boolean;
  onToggle?: () => void;
  className?: string;
}

function ConnectionStatus(props: ConnectionStatusProps): JSX.Element;
```

### 使用示例

```tsx
import { LoadingState, ErrorState, EmptyState, ConnectionStatus } from '@/components/markdown';

function ContentViewer({ content, isLoading, error }) {
  if (isLoading) {
    return <LoadingState message="加载文档中..." />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={handleRetry} />;
  }

  if (!content) {
    return <EmptyState title="无内容" message="请选择一个文件查看" />;
  }

  return <MarkdownContent content={content} />;
}
```

---

## 📘 BackToTopButton

**路径:** `src/components/markdown/BackToTopButton.tsx`

### 功能描述
浮动返回顶部按钮，根据滚动位置自动显示/隐藏。

### API

```typescript
interface BackToTopButtonProps {
  show: boolean;
  onClick: () => void;
  className?: string;
}

function BackToTopButton(props: BackToTopButtonProps): JSX.Element | null;
```

### 使用示例

```tsx
import { BackToTopButton } from '@/components/markdown';
import { useScrollPosition } from '@/hooks';

function ContentArea() {
  const { showBackToTop, scrollToTop } = useScrollPosition();

  return (
    <div>
      <Content />
      <BackToTopButton show={showBackToTop} onClick={scrollToTop} />
    </div>
  );
}
```

---

## 📘 MarkdownHeader

**路径:** `src/components/markdown/MarkdownHeader.tsx`

### 功能描述
Markdown 查看器头部组件，包含文件信息显示、工具栏操作（目录切换、实时模式、刷新等）。

### API

```typescript
interface MarkdownHeaderProps {
  filePath?: string;
  toc: any[];
  showToc: boolean;
  setShowToc: (show: boolean) => void;
  lastUpdateTime: Date | null;
  isRealTimeEnabled: boolean;
  setIsRealTimeEnabled: (enabled: boolean) => void;
  isConnected: boolean;
  onClearScroll: () => void;
  onRefresh: () => void;
}

const MarkdownHeader: React.FC<MarkdownHeaderProps>;
```

---

## 📘 MarkdownContent

**路径:** `src/components/markdown/MarkdownContent.tsx`

### 功能描述
核心 Markdown 内容渲染区域，封装了 react-markdown 的配置。

### API

```typescript
interface MarkdownContentProps {
  content: string;
  onHeadingClick: (id: string) => void;
}

const MarkdownContent: React.FC<MarkdownContentProps>;
```

---

## 📘 MarkdownViewer

**路径:** `src/components/MarkdownViewer.tsx`

### 功能描述
核心 Markdown 查看器容器，作为 MarkdownHeader 和 MarkdownContent 的协调者。

### 主要功能
- 📄 Markdown 渲染 (react-markdown)
- 🎨 语法高亮 (react-syntax-highlighter)
- 📊 Mermaid 图表渲染
- 📋 自动目录生成
- 🔄 实时内容刷新
- 📍 滚动位置记忆
- ⌨️ 键盘快捷键支持

### 依赖关系

```
MarkdownViewer
├── useMarkdownLoader (内容加载)
├── useScrollPosition (滚动追踪)
├── MarkdownHeader (头部/工具栏)
├── MarkdownContent (内容渲染)
├── LeftSideToc (左侧目录)
├── StateComponents (状态显示)
└── BackToTopButton (返回顶部)
```

---

## 📘 CodeBlock

**路径:** `src/components/markdown/CodeBlock.tsx`

### 功能描述
代码块渲染组件，支持语法高亮和复制功能。

### 支持的语言
- JavaScript/TypeScript
- Python
- Java
- Go
- Rust
- C/C++
- HTML/CSS
- JSON/YAML
- Bash/Shell
- SQL
- 以及更多...

### 特性
- 🎨 语法高亮 (react-syntax-highlighter)
- 📋 一键复制
- 🏷️ 语言标签显示
- 🌙 暗色/亮色主题适配

---

## 📘 MermaidChart

**路径:** `src/components/markdown/MermaidChart.tsx`

### 功能描述
Mermaid 图表渲染组件。

### 支持的图表类型
- 流程图 (flowchart)
- 时序图 (sequence)
- 类图 (classDiagram)
- 状态图 (stateDiagram)
- 甘特图 (gantt)
- 饼图 (pie)
- 更多...

---

## 🧪 测试覆盖

| 组件 | 测试文件 | 测试数 |
|------|----------|--------|
| StateComponents | `__tests__/StateComponents.test.tsx` | 14 |
| BackToTopButton | `__tests__/BackToTopButton.test.tsx` | 6 |
| MarkdownViewer | `../__tests__/MarkdownViewer.test.tsx` | 7 |

---

## � Context Providers

### FileContext

**路径:** `src/contexts/FileContext.tsx`

管理文件选择状态和标签页。

```typescript
interface FileTab {
  path: string;
  name: string;
  isActive: boolean;
}

interface FileContextType {
  selectedFile: string;
  openTabs: FileTab[];
  refreshKey: number;
  selectFile: (filePath: string) => void;
  openFile: (filePath: string) => void;
  closeTab: (filePath: string) => void;
  refreshFileTree: () => void;
}
```

#### 使用示例

```tsx
import { FileProvider, useFileContext } from '@/contexts/FileContext';

// 在根组件包裹
function App() {
  return (
    <FileProvider>
      <MainLayout />
    </FileProvider>
  );
}

// 在子组件中使用
function FileViewer() {
  const { selectedFile, openFile, closeTab } = useFileContext();
  // ...
}
```

### SearchContext

**路径:** `src/contexts/SearchContext.tsx`

管理全局搜索对话框状态。

```typescript
interface SearchContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  onFileSelect: ((sessionId: string, relativePath: string) => void) | null;
  setOnFileSelect: (callback: ((sessionId: string, relativePath: string) => void) | null) => void;
}
```

#### 使用示例

```tsx
import { SearchProvider, useSearch } from '@/contexts/SearchContext';

function SearchButton() {
  const { toggle } = useSearch();
  return <Button onClick={toggle}>Search (Ctrl+K)</Button>;
}
```

---

## �📚 相关链接

- [Hooks 文档](hooks.md)
- [测试文档](testing.md)
- [项目 README](../../README.md)
