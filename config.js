import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, '.project-root.json');

class ConfigManager {
  constructor() {
    this._projectRoot = this._loadProjectRoot();
  }

  _loadProjectRoot() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        if (data.projectRoot && fs.existsSync(data.projectRoot)) {
          return data.projectRoot;
        }
      }
    } catch {
      // Fall through to default
    }
    return path.join(os.homedir(), 'Documents');
  }

  _saveProjectRoot(projectRoot) {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ projectRoot }, null, 2));
      return true;
    } catch {
      return false;
    }
  }

  get PROJECT_ROOT() {
    return this._projectRoot;
  }

  setProjectRoot(newPath) {
    if (typeof newPath === 'string' && newPath.trim()) {
      this._projectRoot = path.resolve(newPath);
      this._saveProjectRoot(this._projectRoot);
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
      POLL_INTERVAL: parseInt(process.env.POLL_INTERVAL) || 3000,
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
      MAX_FILE_SIZE: 10 * 1024 * 1024,
    };
  }
}

const configManager = new ConfigManager();

const config = new Proxy(configManager, {
  get(target, prop) {
    if (typeof target[prop] === 'function') {
      return target[prop].bind(target);
    }
    return target[prop];
  }
});

export default config;
