const path = require('path');

// 应用配置
const config = {
  // 项目根路径 - 可以通过环境变量覆盖
  PROJECT_ROOT: process.env.MARKDOWN_PROJECT_ROOT || path.resolve(process.env.HOME || '~', 'project-wiki'),
  
  // 服务器配置
  SERVER: {
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || 'localhost'
  },
  
  // 文件监控配置
  WATCH: {
    POLL_INTERVAL: parseInt(process.env.POLL_INTERVAL) || 3000, // 轮询间隔(毫秒)
    IGNORED_PATTERNS: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/*.log'
    ]
  },
  
  // 文件类型配置
  FILE_TYPES: {
    MARKDOWN_EXTENSIONS: ['.md', '.markdown', '.mdown', '.mkdn', '.mkd'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  }
};

module.exports = config; 