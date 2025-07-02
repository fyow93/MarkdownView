#!/bin/bash

# Markdown Viewer - Next.js Version
# 启动脚本

echo "🚀 启动 Markdown Viewer (Next.js版本)..."

# 加载环境变量（如果存在.env文件）
if [ -f ".env" ]; then
    echo "📋 加载环境变量..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# 显示当前配置
echo "📋 当前配置:"
echo "  项目路径: ${MARKDOWN_PROJECT_ROOT:-~/project-wiki}"
echo "  前端端口: 8080"
echo "  服务端口: ${PORT:-8000}"
echo "  主机: ${HOST:-localhost}"

# 检查Node.js版本
echo "📋 检查环境..."
node --version
npm --version

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 构建应用（可选，开发模式不需要）
if [ "$1" = "build" ]; then
    echo "🔨 构建应用..."
    npm run build
    echo "✅ 构建完成"
    exit 0
fi

# 启动开发服务器
if [ "$1" = "prod" ]; then
    echo "🌟 启动生产服务器 (前端:8080 + Socket.IO:8000)..."
    npm run build && npm run start:all
elif [ "$1" = "socket" ]; then
    echo "🔧 启动Socket.IO服务器 (端口:8000)..."
    npm run dev:socket
elif [ "$1" = "all" ]; then
    echo "🔧 启动完整开发服务器 (前端:8080 + Socket.IO:8000)..."
    npm run dev:all
else
    echo "🔧 启动前端开发服务器 (端口:8080)..."
    npm run dev
fi 