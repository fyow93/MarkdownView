const { createServer } = require('http');
const { Server } = require('socket.io');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');

const hostname = config.SERVER.HOST;
const port = config.SERVER.PORT;

// 从配置文件获取项目根目录
const PROJECT_ROOT = config.PROJECT_ROOT;

// 创建HTTP服务器
const httpServer = createServer((req, res) => {
  // 简单的健康检查端点
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  
  // 默认响应
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Socket.IO server is running' }));
});

// 创建Socket.IO服务器
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:8080",
    methods: ['GET', 'POST']
  }
});

  // 文件监控器
  let watcher = null;
  const watchedFiles = new Set();

  io.on('connection', (socket) => {
    console.log('🔌 客户端连接:', socket.id);

    // 监听文件变化请求
    socket.on('watch-file', (filePath) => {
      if (!filePath || !filePath.endsWith('.md')) {
        return;
      }

      console.log('👀 开始监控文件:', filePath);
      
      const fullPath = path.join(PROJECT_ROOT, filePath);
      
      // 检查文件是否存在
      if (!fs.existsSync(fullPath)) {
        console.log('❌ 文件不存在:', fullPath);
        return;
      }

      // 添加到监控列表
      watchedFiles.add(filePath);

      // 如果没有监控器，创建一个
      if (!watcher) {
        watcher = chokidar.watch([], {
          ignored: /(^|[\/\\])\../, // 忽略隐藏文件
          persistent: true,
          ignoreInitial: true
        });

        watcher.on('change', (changedPath) => {
          // 获取相对路径
          const relativePath = path.relative(PROJECT_ROOT, changedPath);
          console.log('📝 文件已更改:', relativePath);
          
          // 通知所有客户端文件已更改
          io.emit('file-changed', relativePath);
        });

        watcher.on('error', (error) => {
          console.error('❌ 文件监控错误:', error);
        });
      }

      // 添加文件到监控
      watcher.add(fullPath);
    });

    // 停止监控文件
    socket.on('unwatch-file', (filePath) => {
      if (filePath && watchedFiles.has(filePath)) {
        console.log('🔇 停止监控文件:', filePath);
        const fullPath = path.join(PROJECT_ROOT, filePath);
        watchedFiles.delete(filePath);
        
        if (watcher) {
          watcher.unwatch(fullPath);
        }
      }
    });

    // 客户端断开连接
    socket.on('disconnect', () => {
      console.log('🔌 客户端断开连接:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error('❌ 服务器启动失败:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 Socket.IO 服务器运行在 http://${hostname}:${port}`);
      console.log(`📋 支持CORS来源: http://localhost:8080`);
    });

  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log('🛑 正在关闭服务器...');
    if (watcher) {
      watcher.close();
    }
    httpServer.close(() => {
      console.log('✅ 服务器已关闭');
      process.exit(0);
    });
  }); 