import { createServer } from 'http';
import { Server } from 'socket.io';
import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import config from './config.js';
import { serverLogger } from './server-logger.mjs';

const hostname = config.SERVER.HOST;
const port = config.SERVER.PORT;

// 从配置文件获取项目根目录
const PROJECT_ROOT = config.PROJECT_ROOT;

// CORS origin from config or environment
const CORS_ORIGIN = process.env.CORS_ORIGIN || `http://localhost:${config.NEXT_PORT || 8080}`;

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
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// 文件监控器
let watcher = null;
const watchedFiles = new Set();

io.on('connection', (socket) => {
  serverLogger.info('🔌 客户端连接:', socket.id);

  // 监听文件变化请求
  socket.on('watch-file', (filePath) => {
    if (!filePath || !filePath.endsWith('.md')) {
      return;
    }

    serverLogger.debug('👀 开始监控文件:', filePath);
    
    const fullPath = path.join(PROJECT_ROOT, filePath);
    
    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      serverLogger.warn('❌ 文件不存在:', fullPath);
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
        serverLogger.debug('📝 文件已更改:', relativePath);
        
        // 通知所有客户端文件已更改
        io.emit('file-changed', relativePath);
      });

      watcher.on('error', (error) => {
        serverLogger.error('❌ 文件监控错误:', error);
      });
    }

    // 添加文件到监控
    watcher.add(fullPath);
  });

  // 停止监控文件
  socket.on('unwatch-file', (filePath) => {
    if (filePath && watchedFiles.has(filePath)) {
      serverLogger.debug('🔇 停止监控文件:', filePath);
      const fullPath = path.join(PROJECT_ROOT, filePath);
      watchedFiles.delete(filePath);
      
      if (watcher) {
        watcher.unwatch(fullPath);
      }
    }
  });

  // 客户端断开连接
  socket.on('disconnect', () => {
    serverLogger.info('🔌 客户端断开连接:', socket.id);
  });
});

httpServer
  .once('error', (err) => {
    serverLogger.error('❌ 服务器启动失败:', err);
    process.exit(1);
  })
  .listen(port, () => {
    serverLogger.info(`🚀 Socket.IO 服务器运行在 http://${hostname}:${port}`);
    serverLogger.info(`📋 支持CORS来源: ${CORS_ORIGIN}`);
  });

// 优雅关闭
process.on('SIGTERM', () => {
  serverLogger.info('🛑 正在关闭服务器...');
  if (watcher) {
    watcher.close();
  }
  httpServer.close(() => {
    serverLogger.info('✅ 服务器已关闭');
    process.exit(0);
  });
});
