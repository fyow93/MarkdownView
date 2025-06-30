# Projects Wiki Viewer

一个基于 React 和 [react-markdown](https://remarkjs.github.io/react-markdown/) 构建的 Markdown 文档查看器，专为 projects-wiki 项目设计。

**注意：此项目已从 projects-wiki/web-viewer 迁移到独立目录，以保持项目知识库的纯粹性。**

## 功能特性

- 📁 **文件树导航** - 浏览项目目录结构
- 📝 **Markdown 渲染** - 完整支持 Markdown 语法，包括 GFM 扩展
- 🎨 **代码高亮** - 支持多种编程语言语法高亮
- 📱 **响应式设计** - 适配桌面和移动设备
- ⚡ **实时加载** - 快速加载文件内容
- 🔍 **错误处理** - 友好的错误提示和离线模式

## 技术栈

### 前端
- **React 19** + **TypeScript**
- **react-markdown** - Markdown 渲染
- **remark-gfm** - GitHub Flavored Markdown 支持
- **react-syntax-highlighter** - 代码语法高亮

### 后端
- **Node.js** + **Express**
- **CORS** - 跨域支持

## 安装和运行

### 快速启动

```bash
# 1. 进入 MarkdownView 目录
cd /home/xtalpi/shuaikang.lin/cursor-wks/MarkdownView

# 2. 安装依赖
npm install

# 3. 同时启动前端和后端服务
npm run dev
```

### 分别启动

```bash
# 启动后端服务 (端口 3001)
npm run server

# 启动前端服务 (端口 3000)
npm start
```

### 生产环境构建

```bash
# 构建前端资源
npm run build

# 启动生产服务器
npm run build:full
```

## 使用方法

1. 启动服务后，在浏览器中访问 http://localhost:3000
2. 左侧文件树显示项目目录结构
3. 点击 `.md` 文件查看内容
4. 支持文件夹展开/收起
5. 移动端支持抽屉式菜单

## API 接口

后端服务运行在 http://localhost:3001，提供以下接口：

- `GET /api/filetree` - 获取项目文件树结构
- `GET /api/file/*` - 获取指定文件内容
- `GET /api/health` - 健康检查

## 项目结构

```
MarkdownView/
├── public/                 # 静态资源
├── src/
│   ├── components/        # React 组件
│   │   ├── FileTree.tsx   # 文件树组件
│   │   ├── FileTree.css
│   │   ├── MarkdownViewer.tsx  # Markdown 查看器
│   │   └── MarkdownViewer.css
│   ├── App.tsx           # 主应用组件
│   ├── App.css           # 主样式
│   └── index.tsx         # 应用入口
├── server.js             # Express 后端服务
├── package.json
└── README.md
```

## 开发说明

### 添加新功能

1. 文件树相关功能请修改 `src/components/FileTree.tsx`
2. Markdown 渲染相关功能请修改 `src/components/MarkdownViewer.tsx`
3. 后端 API 请修改 `server.js`

### 样式自定义

- 全局样式：`src/App.css`
- 文件树样式：`src/components/FileTree.css`
- Markdown 内容样式：`src/components/MarkdownViewer.css`

### 支持的 Markdown 功能

- 标题、段落、列表
- 代码块和行内代码
- 表格
- 任务列表 (GitHub 风格)
- 链接和图片
- 引用块
- 水平分割线

## 故障排除

### 常见问题

1. **文件树不显示或显示 "离线模式"**
   - 确保后端服务正在运行 (端口 3001)
   - 检查控制台是否有网络错误

2. **文件内容加载失败**
   - 确保文件存在于项目目录中
   - 检查文件是否为 `.md` 格式
   - 查看浏览器控制台获取详细错误信息

3. **样式显示异常**
   - 清除浏览器缓存
   - 确保 CSS 文件正确导入

### 调试模式

```bash
# 查看后端日志
npm run server

# 前端开发模式 (包含热重载)
npm start
```

## 许可证

本项目基于 MIT 许可证开源。

---

*为 projects-wiki 项目特别定制的 Markdown 文档查看器*
