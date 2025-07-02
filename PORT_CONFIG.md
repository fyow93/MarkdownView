# 端口配置说明

本项目已配置为使用以下端口：

## 端口分配

- **前端（Next.js）**: 8080端口
- **服务端（Socket.IO）**: 8000端口

## 启动方式

### 开发环境

1. **只启动前端**：
   ```bash
   ./start.sh
   # 或
   npm run dev
   ```
   - 访问：http://localhost:8080

2. **只启动Socket.IO服务器**：
   ```bash
   ./start.sh socket
   # 或
   npm run dev:socket
   ```
   - 服务运行在：http://localhost:8000

3. **同时启动前端和Socket.IO服务器**：
   ```bash
   ./start.sh all
   # 或
   npm run dev:all
   ```
   - 前端：http://localhost:8080
   - Socket.IO：http://localhost:8000

### 生产环境

```bash
./start.sh prod
# 或
npm run start:all
```

## 配置文件

端口配置在以下文件中：

1. **`.env`** - 服务端口配置（默认8000）
2. **`package.json`** - 前端启动脚本指定8080端口
3. **`config.js`** - 服务器配置管理

## 注意事项

- 前端和服务端现在是分离的，可以独立启动
- Socket.IO服务器配置了CORS，允许来自8080端口的前端访问
- 如果需要修改端口，请同时更新相关配置文件
