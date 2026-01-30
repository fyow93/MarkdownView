# Markdown Viewer - Next.js 版本

这是一个使用 Next.js 和 shadcn/ui 构建的现代化 Markdown 文档查看器项目。

> 📚 **开发者文档**: 查看 [docs/CODEMAPS/](docs/CODEMAPS/INDEX.md) 了解项目架构和代码结构

## 🌍 语言选择

- [中文](README.md)
- [English](README.en.md)

## 🚀 主要特性

- **🎨 现代化UI**: 基于 shadcn/ui 组件库的精美界面设计，支持渐变背景和动画效果
- **📱 响应式设计**: 完美适配桌面和移动端设备，流畅的用户体验
- **📁 智能目录选择**: 通过UI界面一键选择项目目录，支持浏览和手动输入两种方式
- **🗂️ 智能目录**: 自动生成文档目录，支持快速跳转和当前位置高亮
- **🌳 文件树导航**: 左侧面板显示项目文件结构，支持展开/收起
- **📝 Markdown渲染**: 支持 GitHub Flavored Markdown，包含表格、任务列表等
- **💻 代码高亮**: 使用 Prism.js 进行多语言语法高亮，带有语言标签
- **📊 Mermaid图表**: 支持流程图、时序图、架构图等多种图表类型
- **🔧 可调整布局**: 桌面端支持拖拽调整面板大小
- **⚡ 实时监控**: 文件变更自动检测和刷新（轮询模式）
- **💾 位置记忆**: 自动保存和恢复用户的浏览位置，支持跨会话
- **🌙 主题切换**: 支持深色/浅色主题切换，跟随系统偏好
- **🌐 国际化**: 支持中英文双语界面
- **⌨️ 键盘快捷键**: Home/End/Ctrl+B/Ctrl+K/Ctrl+R 等快捷操作
- **🧪 测试覆盖**: 116个单元测试，遵循TDD开发模式

## 🛠️ 技术栈

- **前端框架**: Next.js 15 with App Router
- **UI组件库**: shadcn/ui
- **样式**: Tailwind CSS v4
- **Markdown渲染**: react-markdown + remark-gfm
- **代码高亮**: react-syntax-highlighter
- **图表**: Mermaid
- **图标**: Lucide React
- **国际化**: next-intl
- **主题**: next-themes

## 📁 项目结构

```
MarkdownView/
├── docs/
│   └── CODEMAPS/                   # 代码架构文档
│       ├── INDEX.md                # 架构概览
│       ├── hooks.md                # Hooks 文档
│       ├── frontend.md             # 组件文档
│       └── testing.md              # 测试文档
├── src/
│   ├── app/
│   │   ├── [locale]/               # 国际化路由
│   │   │   ├── layout.tsx          # 国际化布局
│   │   │   └── page.tsx            # 国际化主页面
│   │   ├── api/                    # API 路由
│   │   │   ├── config/project-root/route.ts  # 项目根目录配置
│   │   │   ├── directories/route.ts          # 目录浏览
│   │   │   ├── filetree/route.ts             # 文件树
│   │   │   ├── file/[...filename]/route.ts   # 文件内容
│   │   │   └── copilot-sessions/             # Copilot 会话
│   │   ├── globals.css             # 全局样式
│   │   ├── layout.tsx              # 根布局
│   │   └── page.tsx                # 根重定向
│   ├── components/
│   │   ├── MarkdownViewer.tsx      # 核心 Markdown 查看器
│   │   ├── FileTree.tsx            # 文件树组件
│   │   ├── DirectorySelector.tsx   # 目录选择器
│   │   ├── ThemeToggle.tsx         # 主题切换
│   │   ├── LanguageToggle.tsx      # 语言切换
│   │   ├── ErrorBoundary.tsx       # 错误边界
│   │   ├── markdown/               # Markdown 子组件
│   │   │   ├── CodeBlock.tsx       # 代码块渲染
│   │   │   ├── HeadingComponent.tsx# 标题渲染
│   │   │   ├── LeftSideToc.tsx     # 左侧目录
│   │   │   ├── MermaidChart.tsx    # Mermaid 图表
│   │   │   ├── StateComponents.tsx # 状态组件 (Loading/Error/Empty)
│   │   │   ├── BackToTopButton.tsx # 返回顶部按钮
│   │   │   ├── index.ts            # 组件导出
│   │   │   └── __tests__/          # 组件测试
│   │   └── ui/                     # shadcn/ui 组件
│   ├── hooks/                      # 自定义 Hooks
│   │   ├── useMarkdownLoader.ts    # Markdown 加载、缓存、TOC
│   │   ├── useScrollPosition.ts    # 滚动位置追踪
│   │   ├── useKeyboardShortcuts.ts # 键盘快捷键
│   │   ├── useToc.ts               # 目录生成
│   │   ├── useSmoothScroll.ts      # 平滑滚动
│   │   ├── useCopilotSessions.ts   # Copilot 会话管理
│   │   ├── useCopilotSessionWatch.ts # 会话监控
│   │   ├── index.ts                # Hooks 导出
│   │   └── __tests__/              # Hooks 测试
│   ├── contexts/
│   │   └── FileContext.tsx         # 文件上下文
│   ├── i18n/                       # 国际化配置
│   │   ├── request.ts
│   │   └── routing.ts
│   ├── lib/
│   │   ├── utils.ts                # 工具函数
│   │   ├── logger.ts               # 日志工具
│   │   ├── copilot-session.ts      # 会话解析
│   │   └── __tests__/              # 库测试
│   └── middleware.ts               # 国际化中间件
├── messages/                       # 国际化翻译
│   ├── en.json
│   └── zh.json
├── vitest.config.ts                # Vitest 测试配置
├── vitest.setup.ts                 # 测试环境设置
└── package.json
```

## 🚀 快速开始

### 1. 启动应用

使用启动脚本：

```bash
# 开发模式
./start.sh

# 生产模式
./start.sh prod

# 仅构建
./start.sh build
```

或直接使用npm命令：

```bash
# 开发模式
npm run dev

# 构建并启动生产服务器
npm run build && npm start
```

### 2. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 3. 选择项目目录

**🎯 一键配置 - 无需任何环境变量设置！**

1. **启动应用后**，点击顶部的 **"File Tree"** 按钮
2. **点击 "Change Directory"** 打开目录选择器
3. **两种选择方式**：
   - **📁 浏览模式**：通过界面导航选择您的项目目录
   - **⌨️ 手动输入**：直接输入目录路径（如：`/home/user/my-docs`）
4. **点击 "Apply"** 应用设置

**默认目录**：首次启动应用默认指向 `~/Documents` 目录

**示例模式**：如果选择的目录为空或不存在，应用将显示功能演示文档 `example.md`，展示所有支持的 Markdown 特性。

**✨ 特点**：
- 🚀 **即时生效**：选择目录后文件树立即更新
- 💾 **自动记忆**：应用会记住您选择的目录
- 🔒 **安全限制**：只能访问用户主目录及子目录，确保系统安全

## 📱 功能说明

### 桌面端
- **新布局设计**: 左侧目录导航 + 主内容区域 + 左上角可缩放文件树
- **智能目录**: 左侧面板显示文档目录，支持快速跳转
- **可缩放文件树**: 左上角浮动文件树，支持最小化/最大化

### 移动端
- **侧滑菜单**: 点击左上角菜单按钮打开文件树
- **自动收起**: 选择文件后自动关闭侧边栏
- **触摸友好**: 优化的触摸交互体验

### ⌨️ 键盘快捷键
| 快捷键 | 功能 |
|--------|------|
| `Home` | 滚动到页面顶部 |
| `End` | 滚动到页面底部 |
| `Ctrl+B` | 切换目录显示/隐藏 |
| `Ctrl+K` | 打开搜索 |
| `Ctrl+R` | 刷新内容 |
| `Ctrl+↑` | 跳转到上一个标题 |
| `Ctrl+↓` | 跳转到下一个标题 |

### 智能目录选择器
- 🎯 **一键配置**: 点击 "Change Directory" 即可选择项目目录
- 📁 **浏览模式**: 通过界面导航选择目录，支持面包屑导航
- ⌨️ **手动输入**: 直接输入目录路径，适合高级用户
- 🔒 **安全限制**: 只能访问用户主目录及子目录，确保系统安全
- 💾 **自动记忆**: 应用记住选择的目录，下次启动自动恢复

### 文件树导航
- 📁 **文件夹**: 支持展开/收起，显示目录结构
- 📄 **Markdown文件**: 点击即可查看内容
- 🎯 **当前文件**: 高亮显示正在查看的文件
- 💾 **记忆功能**: 自动记住最后选择的文件

### 智能目录
- 📋 **自动生成**: 扫描文档标题自动生成目录，正确处理HTML标签
- 🎯 **快速跳转**: 点击目录项快速定位到对应章节，平滑滚动
- 📍 **当前位置**: 高亮显示当前阅读位置
- 🔢 **层级显示**: 支持多级标题的层次结构和缩进
- 👁️ **显示控制**: 可以隐藏/显示目录面板
- 🧹 **文本清理**: 自动移除HTML标签和Markdown格式符号

### Markdown 渲染
- **标准语法**: 支持完整的 Markdown 语法
- **GitHub扩展**: 支持表格、任务列表、删除线等
- **语法高亮**: 多种编程语言的代码高亮
- **图表渲染**: Mermaid 图表实时渲染

### 实时监控功能
- 📡 自动检测文件变更并实时刷新内容 (轮询模式)
- 🔌 实时监控连接状态显示
- ⚡ 可以手动启用/禁用实时监控
- 🔄 文件变更时保持当前滚动位置
- ⏱️ 每3秒检查一次文件变更

### 位置记忆功能
- 📍 自动保存每个文件的滚动位置
- 🔄 文件刷新后自动恢复到上次浏览位置
- 💾 页面刷新后记住最后选中的文件
- 🗑️ 支持清除单个文件的位置记录
- 🎯 智能防抖保存，避免频繁写入

## 🔧 自定义配置

### 可选环境变量
如需要，可以创建 `.env` 文件进行可选配置：
```bash
# 复制示例文件
cp env.example .env

# 编辑可选配置（端口、轮询间隔等）
nano .env
```

**注意**：项目目录配置已完全通过UI界面管理，无需环境变量设置。

### 添加新的 shadcn/ui 组件

```bash
npx shadcn@latest add [component-name]
```

### 修改主题

编辑 `src/app/globals.css` 中的 CSS 变量来自定义主题颜色。

### 添加新的 Markdown 插件

在 `src/components/MarkdownViewer.tsx` 中的 `remarkPlugins` 或 `rehypePlugins` 数组中添加新插件。

## � 测试

本项目使用 Vitest 进行单元测试，遵循 TDD 开发模式。

```bash
# 运行所有测试
pnpm test

# 监视模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage

# UI 界面运行测试
pnpm test:ui
```

**测试统计:**
- 总测试数: 116
- 测试文件: 10
- 通过率: 100%

详细测试文档请参阅 [docs/CODEMAPS/testing.md](docs/CODEMAPS/testing.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
