# 📚 Codemap Index

> Last Updated: 2025-01-26

本目录包含 MarkdownView 项目的代码架构文档，帮助开发者快速理解代码结构和模块关系。

## 📋 目录结构

| 文件 | 描述 | 主要内容 |
|------|------|----------|
| [hooks.md](hooks.md) | 自定义 Hooks 文档 | useMarkdownLoader, useScrollPosition, useKeyboardShortcuts 等 |
| [frontend.md](frontend.md) | 前端组件架构 | UI组件、Markdown组件、状态管理 |
| [testing.md](testing.md) | 测试覆盖详情 | 测试策略、覆盖率、测试文件列表 |

## 🏗️ 项目架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App Router                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐         │
│  │   Pages     │   │  Layouts    │   │  Middleware │         │
│  │  (locale)   │   │  (i18n)     │   │  (routing)  │         │
│  └──────┬──────┘   └──────┬──────┘   └─────────────┘         │
│         │                 │                                   │
│         ▼                 ▼                                   │
│  ┌─────────────────────────────────────────────────┐         │
│  │              Components Layer                    │         │
│  │  ┌───────────────┐  ┌───────────────────────┐   │         │
│  │  │ UI Components │  │ Markdown Components   │   │         │
│  │  │ (shadcn/ui)   │  │ (viewer, toolbar)     │   │         │
│  │  └───────────────┘  └───────────────────────┘   │         │
│  └─────────────────────────────────────────────────┘         │
│                          │                                    │
│                          ▼                                    │
│  ┌─────────────────────────────────────────────────┐         │
│  │               Custom Hooks Layer                 │         │
│  │  ┌─────────────────┐  ┌──────────────────┐      │         │
│  │  │useMarkdownLoader│  │useScrollPosition │      │         │
│  │  ├─────────────────┤  ├──────────────────┤      │         │
│  │  │useKeyboardShorts│  │useCopilotSessions│      │         │
│  │  └─────────────────┘  └──────────────────┘      │         │
│  └─────────────────────────────────────────────────┘         │
│                          │                                    │
│                          ▼                                    │
│  ┌─────────────────────────────────────────────────┐         │
│  │                 API Layer                        │         │
│  │  /api/file      /api/filetree    /api/config    │         │
│  │  /api/directories  /api/copilot-sessions        │         │
│  └─────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 入口点

| 入口 | 路径 | 描述 |
|------|------|------|
| 主页面 | `src/app/[locale]/page.tsx` | 应用主入口，渲染 Markdown 查看器 |
| 根布局 | `src/app/layout.tsx` | 全局布局和主题提供者 |
| 中间件 | `src/middleware.ts` | 国际化路由和 API 路由处理 |
| 开发服务器 | `server.mjs` | 自定义开发服务器配置 |

## 📊 模块统计

| 类别 | 数量 | 测试数 |
|------|------|--------|
| 自定义 Hooks | 8 | 75 |
| UI 组件 | 12 | 14 |
| Markdown 组件 | 7 | 33 |
| API 路由 | 8 | - |
| 库函数 | 4 | 18 |
| **总计** | **39** | **140** |

## 🔄 最近更新 (2026-01-26)

### 新增 Hooks
- `useMarkdownLoader` - Markdown 内容加载、LRU缓存、TOC生成
- `useScrollPosition` - 滚动位置追踪、返回顶部功能
- `useKeyboardShortcuts` - 键盘快捷键支持
- `useFileWatch` - SSE 文件变更监控
- `useCopilotSessions` - Copilot CLI 会话管理
- `useCopilotSessionWatch` - 会话实时更新监控

### 新增组件
- `StateComponents` - 加载/错误/空状态组件
- `BackToTopButton` - 返回顶部按钮
- `MarkdownToolbar` - Markdown工具栏

### 新增 Contexts
- `FileContext` - 文件选择和标签页管理
- `SearchContext` - 搜索状态管理

### 新增库函数
- `buildFileApiUrl` - 智能 API URL 构建 (避免双重前缀)
- `CopilotSessionService` - 会话文件读取服务
- `search.ts` - 跨会话搜索功能

### 测试改进
- 测试数量: 116 → 140 (+21%)
- 新增测试文件: useFileWatch.test.ts, utils.test.ts

## 📝 文档规范

所有 codemap 文档遵循以下格式：
1. 标题和最后更新日期
2. 模块概览表格
3. ASCII 架构图
4. 详细 API 文档
5. 使用示例
6. 相关链接
