# Projects Wiki Viewer - Next.js 版本

这是一个使用 Next.js 和 shadcn/ui 重构的 Markdown 文档查看器项目。

## 🚀 主要特性

- **现代化UI**: 使用 shadcn/ui 组件库构建的美观界面
- **响应式设计**: 支持桌面和移动端设备
- **文件树导航**: 左侧面板显示项目文件结构
- **Markdown渲染**: 支持 GitHub Flavored Markdown
- **代码高亮**: 使用 Prism.js 进行语法高亮
- **Mermaid图表**: 支持 Mermaid 图表渲染
- **可调整布局**: 桌面端支持拖拽调整面板大小
- **实时监控**: 使用 Socket.IO 实现文件变更的实时监控和自动刷新
- **位置记忆**: 自动保存和恢复用户的浏览位置，刷新后自动定位

## 🛠️ 技术栈

- **前端框架**: Next.js 15 with App Router
- **UI组件库**: shadcn/ui
- **样式**: Tailwind CSS v4
- **Markdown渲染**: react-markdown + remark-gfm
- **代码高亮**: react-syntax-highlighter
- **图表**: Mermaid
- **图标**: Lucide React

## 📁 项目结构

```
MarkdownView/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── filetree/
│   │   │   │   └── route.ts        # 文件树 API
│   │   │   └── file/
│   │   │       └── [...filename]/
│   │   │           └── route.ts    # 文件内容 API
│   │   ├── globals.css             # 全局样式
│   │   ├── layout.tsx              # 根布局
│   │   └── page.tsx                # 主页面
│   └── components/
│       ├── FileTree.tsx            # 文件树组件
│       ├── MarkdownViewer.tsx      # Markdown查看器组件
│       └── ui/                     # shadcn/ui 组件
│           ├── button.tsx
│           ├── card.tsx
│           ├── resizable.tsx
│           ├── scroll-area.tsx
│           └── separator.tsx
├── example.md                      # 功能演示文档
├── config.js                       # 应用配置文件
├── components.json                 # shadcn/ui 配置
├── start.sh                        # 启动脚本
├── check-status.sh                 # 状态检查脚本
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

### 3. 配置项目根目录

应用支持通过多种方式灵活配置项目路径：

#### 方法1：环境变量配置（推荐）
```bash
# 设置项目根路径
export MARKDOWN_PROJECT_ROOT=/path/to/your/markdown/project

# 可选：设置其他配置
export PORT=3000
export HOST=localhost
export POLL_INTERVAL=3000

# 然后启动应用
./start.sh
```

#### 方法2：创建 .env 文件
```bash
# 复制环境变量示例文件
cp env.example .env

# 编辑 .env 文件设置你的项目路径
nano .env
```

#### 方法3：修改配置文件
直接编辑 `config.js` 文件中的默认路径。

**默认路径**：如果未设置环境变量，应用将使用 `~/project-wiki`

**示例模式**：如果配置的项目目录不存在，应用将自动显示功能演示文档 `example.md`，展示所有支持的 Markdown 特性。

## 📱 功能说明

### 桌面端
- 左侧面板显示文件树
- 右侧面板显示选中的 Markdown 文件内容
- 可以拖拽中间的分隔线调整面板大小

### 移动端
- 点击左上角的菜单按钮打开文件树
- 选择文件后自动关闭侧边栏
- 点击遮罩层关闭侧边栏

### 文件树
- 📁 文件夹图标表示目录
- 📄 文件图标表示 Markdown 文件
- 点击文件夹展开/收起
- 点击文件查看内容

### Markdown 渲染
- 支持标准 Markdown 语法
- 支持 GitHub Flavored Markdown (表格、任务列表等)
- 支持代码块语法高亮
- 支持 Mermaid 图表渲染

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

### 添加新的 shadcn/ui 组件

```bash
npx shadcn@latest add [component-name]
```

### 修改主题

编辑 `src/app/globals.css` 中的 CSS 变量来自定义主题颜色。

### 添加新的 Markdown 插件

在 `src/components/MarkdownViewer.tsx` 中的 `remarkPlugins` 或 `rehypePlugins` 数组中添加新插件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License
