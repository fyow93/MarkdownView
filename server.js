const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const chokidar = require('chokidar');

const app = express();
const PORT = 3001;

// 启用CORS
app.use(cors());

// 项目根目录
const PROJECT_ROOT = path.resolve('/home/xtalpi/shuaikang.lin/cursor-wks/projects-wiki');

// 安全检查函数 - 防止目录遍历攻击
function isValidPath(requestedPath) {
  const resolvedPath = path.resolve(PROJECT_ROOT, requestedPath);
  return resolvedPath.startsWith(PROJECT_ROOT);
}

// 递归获取目录结构
function getDirectoryStructure(dirPath, relativePath = '') {
  const items = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // 跳过隐藏文件和特定目录
      if (entry.name.startsWith('.') || 
          entry.name === 'node_modules' || 
          entry.name === 'dist' || 
          entry.name === 'build') {
        continue;
      }
      
      const itemPath = path.join(dirPath, entry.name);
      const itemRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        const children = getDirectoryStructure(itemPath, itemRelativePath);
        if (children.length > 0 || entry.name.endsWith('-test') || entry.name.includes('example')) {
          items.push({
            name: entry.name,
            type: 'directory',
            path: itemRelativePath,
            children: children
          });
        }
      } else if (entry.name.endsWith('.md')) {
        items.push({
          name: entry.name,
          type: 'file',
          path: itemRelativePath,
          size: fs.statSync(itemPath).size
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

// API路由 - 获取文件树
app.get('/api/filetree', (req, res) => {
  try {
    console.log('Fetching file tree from:', PROJECT_ROOT);
    const tree = getDirectoryStructure(PROJECT_ROOT);
    res.json(tree);
  } catch (error) {
    console.error('Error generating file tree:', error);
    res.status(500).json({ error: '生成文件树失败' });
  }
});

// API路由 - 获取文件内容
app.get('/api/file/:filename', (req, res) => {
  const requestedFile = decodeURIComponent(req.params.filename);
  
  if (!requestedFile) {
    return res.status(400).json({ error: '文件名不能为空' });
  }
  
  // 安全检查
  if (!isValidPath(requestedFile)) {
    return res.status(403).json({ error: '访问被拒绝：无效的文件路径' });
  }
  
  // 只允许访问.md文件
  if (!requestedFile.endsWith('.md')) {
    return res.status(403).json({ error: '访问被拒绝：只能访问Markdown文件' });
  }
  
  const filePath = path.join(PROJECT_ROOT, requestedFile);
  
  console.log('Requested file:', requestedFile);
  console.log('Full path:', filePath);
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return res.status(404).json({ error: '文件未找到' });
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    
    // 移除可能存在的CSS链接引用（在服务器端处理）
    content = content.replace(/<link[^>]*href[^>]*\.css[^>]*>/gi, '');
    content = content.replace(/^\s*<link[^>]*>\s*$/gm, '');
    
    res.json({
      content: content,
      lastModified: stats.mtime,
      size: stats.size
    });
    
    console.log(`Successfully served file: ${requestedFile} (${stats.size} bytes)`);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: '读取文件失败' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    projectRoot: PROJECT_ROOT
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'Projects Wiki API Server',
    version: '1.0.0',
    endpoints: {
      '/api/filetree': 'GET - 获取项目文件树',
      '/api/file/:filename': 'GET - 获取文件内容',
      '/api/health': 'GET - 健康检查'
    },
    project: 'React Markdown Viewer',
    port: PORT
  });
});

// 创建HTTP服务器和Socket.IO服务器
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 存储当前连接的客户端
const connectedClients = new Set();

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log(`👤 客户端已连接: ${socket.id}`);
  connectedClients.add(socket);
  
  // 客户端断开连接
  socket.on('disconnect', () => {
    console.log(`👋 客户端已断开连接: ${socket.id}`);
    connectedClients.delete(socket);
  });
  
  // 客户端订阅文件监控
  socket.on('subscribe-file', (filePath) => {
    console.log(`📝 客户端 ${socket.id} 订阅文件: ${filePath}`);
    socket.join(`file:${filePath}`);
  });
  
  // 客户端取消订阅文件监控
  socket.on('unsubscribe-file', (filePath) => {
    console.log(`📝 客户端 ${socket.id} 取消订阅文件: ${filePath}`);
    socket.leave(`file:${filePath}`);
  });
});

// 文件监控设置
const watcher = chokidar.watch(PROJECT_ROOT, {
  ignored: [
    /(^|[\/\\])\../, // 忽略隐藏文件
    /node_modules/,
    /dist/,
    /build/,
    /\.git/,
    /\.log$/,
    /package-lock\.json$/
  ],
  persistent: true,
  ignoreInitial: true,
  depth: 10
});

// 文件变化处理函数
const handleFileChange = (eventType, filePath) => {
  // 只处理.md文件
  if (!filePath.endsWith('.md')) {
    return;
  }
  
  // 获取相对路径
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  
  console.log(`📁 文件${eventType}: ${relativePath}`);
  
  // 通知订阅该文件的客户端
  io.to(`file:${relativePath}`).emit('file-changed', {
    filePath: relativePath,
    eventType: eventType,
    timestamp: new Date().toISOString()
  });
  
  // 如果是文件结构变化，通知所有客户端更新文件树
  if (eventType === 'add' || eventType === 'unlink') {
    io.emit('filetree-changed', {
      timestamp: new Date().toISOString()
    });
  }
};

// 监听文件变化事件
watcher
  .on('change', (filePath) => handleFileChange('change', filePath))
  .on('add', (filePath) => handleFileChange('add', filePath))
  .on('unlink', (filePath) => handleFileChange('unlink', filePath))
  .on('ready', () => {
    console.log('👀 文件监控系统已启动');
    console.log(`📂 监控目录: ${PROJECT_ROOT}`);
  })
  .on('error', (error) => {
    console.error('❌ 文件监控错误:', error);
  });

// 启动服务器
server.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📁 Project root: ${PROJECT_ROOT}`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  📊 GET /api/filetree - 获取文件树`);
  console.log(`  📄 GET /api/file/:filename - 获取文件内容`);
  console.log(`  ❤️  GET /api/health - 健康检查`);
  console.log(`  🔌 WebSocket /socket.io - 实时文件更新`);
  console.log('');
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
}); 