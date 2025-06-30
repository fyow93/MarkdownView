const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// 项目根目录
const PROJECT_ROOT = path.resolve('/home/xtalpi/shuaikang.lin/cursor-wks/projects-wiki');

// 当在生产环境下，next() 可能是 Promise
const app = next({ 
  dev, 
  hostname, 
  port,
  turbo: false, // 禁用 Turbopack 避免兼容性问题
  customServer: true
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // 创建Socket.IO服务器
  const io = new Server(httpServer, {
    cors: {
      origin: `http://${hostname}:${port}`,
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
      console.log(`🚀 Next.js + Socket.IO 服务器运行在 http://${hostname}:${port}`);
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
}); 