const path = require('path');
const os = require('os');

// 运行时配置管理器
class ConfigManager {
  constructor() {
    // 默认项目根路径设置为用户文档目录，不再依赖环境变量
    // 用户需要通过UI界面选择实际的项目目录
    this._projectRoot = path.join(os.homedir(), 'Documents');
  }

  get PROJECT_ROOT() {
    return this._projectRoot;
  }

  setProjectRoot(newPath) {
    if (typeof newPath === 'string' && newPath.trim()) {
      this._projectRoot = path.resolve(newPath);
      console.log('Project root changed to:', this._projectRoot);
      return true;
    }
    return false;
  }

  get EXAMPLE_FILE() {
    return path.resolve(__dirname, 'example.md');
  }

  get SERVER() {
    return {
      PORT: process.env.PORT || 8000,
      HOST: process.env.HOST || 'localhost'
    };
  }

  get WATCH() {
    return {
      POLL_INTERVAL: parseInt(process.env.POLL_INTERVAL) || 3000, // 轮询间隔(毫秒)
      IGNORED_PATTERNS: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.DS_Store',
        '**/Thumbs.db',
        '**/*.log'
      ]
    };
  }

  get FILE_TYPES() {
    return {
      MARKDOWN_EXTENSIONS: ['.md', '.markdown', '.mdown', '.mkdn', '.mkd'],
      MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    };
  }
}

// 创建单例实例
const configManager = new ConfigManager();

// 兼容性：导出对象，保持现有代码正常工作
const config = new Proxy(configManager, {
  get(target, prop) {
    if (typeof target[prop] === 'function') {
      return target[prop].bind(target);
    }
    return target[prop];
  }
});

module.exports = config;
