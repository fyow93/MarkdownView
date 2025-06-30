# MarkdownView 配置指南

本文档说明如何配置 MarkdownView 应用的各种设置。

## 📁 项目路径配置

MarkdownView 需要指定一个包含 Markdown 文件的目录作为项目根路径。支持以下三种配置方式：

### 方法1：环境变量配置（推荐）

设置环境变量后启动应用：

```bash
# 设置项目根路径
export MARKDOWN_PROJECT_ROOT=/path/to/your/markdown/project

# 可选：设置其他配置
export PORT=3000
export HOST=localhost
export POLL_INTERVAL=3000

# 启动应用
./start.sh
```

### 方法2：.env 文件配置

1. 复制环境变量示例文件：
```bash
cp env.example .env
```

2. 编辑 `.env` 文件：
```bash
# MarkdownView 配置文件

# 项目根路径 - 指向包含Markdown文件的目录
MARKDOWN_PROJECT_ROOT=/path/to/your/markdown/project

# 服务器配置
PORT=3000
HOST=localhost

# 文件监控配置
POLL_INTERVAL=3000

# Node.js 环境
NODE_ENV=development
```

3. 启动应用：
```bash
./start.sh
```

### 方法3：直接修改配置文件

编辑 `config.js` 文件中的默认配置：

```javascript
const config = {
  // 修改这里的默认路径
  PROJECT_ROOT: process.env.MARKDOWN_PROJECT_ROOT || '/your/custom/path',
  
  // 其他配置...
};
```

## ⚙️ 配置选项说明

### 项目路径配置

- **MARKDOWN_PROJECT_ROOT**: Markdown 文件所在的根目录
- **默认值**: `~/project-wiki`
- **示例**: `/home/user/documents/wiki`

### 服务器配置

- **PORT**: 服务器监听端口
- **默认值**: `3000`
- **HOST**: 服务器绑定的主机地址
- **默认值**: `localhost`

### 文件监控配置

- **POLL_INTERVAL**: 文件变更检查间隔（毫秒）
- **默认值**: `3000` (3秒)
- **范围**: 建议 1000-10000 毫秒

## 🔧 高级配置

### 自定义忽略模式

在 `config.js` 中的 `WATCH.IGNORED_PATTERNS` 数组中添加要忽略的文件模式：

```javascript
WATCH: {
  IGNORED_PATTERNS: [
    '**/node_modules/**',
    '**/.git/**',
    '**/.DS_Store',
    '**/Thumbs.db',
    '**/*.log',
    // 添加你的自定义模式
    '**/temp/**',
    '**/*.tmp'
  ]
}
```

### 文件类型配置

配置支持的 Markdown 文件扩展名：

```javascript
FILE_TYPES: {
  MARKDOWN_EXTENSIONS: ['.md', '.markdown', '.mdown', '.mkdn', '.mkd'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
}
```

## 🚀 使用示例

### 示例1：开发环境配置

```bash
# 开发环境设置
export MARKDOWN_PROJECT_ROOT=/home/user/projects/docs
export PORT=3000
export POLL_INTERVAL=2000
export NODE_ENV=development

./start.sh
```

### 示例2：生产环境配置

```bash
# 生产环境设置
export MARKDOWN_PROJECT_ROOT=/var/www/docs
export PORT=8080
export HOST=0.0.0.0
export POLL_INTERVAL=5000
export NODE_ENV=production

./start.sh prod
```

### 示例3：多项目切换

```bash
# 项目A
export MARKDOWN_PROJECT_ROOT=/path/to/project-a
./start.sh

# 停止服务器后切换到项目B
export MARKDOWN_PROJECT_ROOT=/path/to/project-b
./start.sh
```

## 🔍 配置验证

使用状态检查脚本验证配置：

```bash
./check-status.sh
```

该脚本会显示：
- 当前配置信息
- 服务器运行状态
- API 功能测试结果

## 📝 注意事项

1. **路径安全**: 应用会验证文件路径，防止目录遍历攻击
2. **文件权限**: 确保应用有权限读取指定目录中的文件
3. **性能考虑**: 轮询间隔不要设置太小，避免过度消耗系统资源
4. **文件大小**: 默认限制单个文件最大 10MB，可在配置中调整

## 🆘 故障排除

### 常见问题

1. **路径不存在**
   - 检查 `MARKDOWN_PROJECT_ROOT` 路径是否正确
   - 确保目录存在且可读

2. **端口被占用**
   - 修改 `PORT` 环境变量
   - 检查其他进程是否占用端口

3. **配置不生效**
   - 重启应用以加载新配置
   - 检查环境变量是否正确设置

### 调试命令

```bash
# 检查当前配置
node -e "console.log(require('./config'))"

# 检查环境变量
env | grep MARKDOWN

# 验证路径存在
ls -la $MARKDOWN_PROJECT_ROOT
```

## 🔄 配置更新

修改配置后需要重启应用才能生效：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
./start.sh
```

---

更多帮助请查看 [README.md](./README.md) 或提交 Issue。 