#!/bin/bash

echo "🔍 验证端口配置..."

# 检查端口是否被占用
check_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo "✅ $name 正在端口 $port 上运行"
        return 0
    else
        echo "❌ $name 未在端口 $port 上运行"
        return 1
    fi
}

# 启动服务
echo "🚀 启动服务..."
cd /home/xtalpi/shuaikang.lin/cursor-wks/MarkdownView

# 后台启动Socket.IO服务器
npm run dev:socket > /dev/null 2>&1 &
SOCKET_PID=$!

# 后台启动前端
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 验证端口
echo "🔍 检查端口状态..."
check_port 8000 "Socket.IO服务器"
check_port 8080 "前端服务器"

# 测试健康检查
echo "🏥 测试健康检查..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Socket.IO服务器健康检查通过"
else
    echo "❌ Socket.IO服务器健康检查失败"
fi

if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ 前端服务器响应正常"
else
    echo "❌ 前端服务器无响应"
fi

# 清理进程
echo "🧹 清理后台进程..."
kill $SOCKET_PID $FRONTEND_PID 2>/dev/null
wait $SOCKET_PID $FRONTEND_PID 2>/dev/null

echo "✅ 验证完成！"
echo ""
echo "📋 总结:"
echo "  - 前端：http://localhost:8080"
echo "  - Socket.IO：http://localhost:8000"
echo ""
echo "🚀 使用以下命令启动："
echo "  开发模式: ./start.sh all"
echo "  仅前端: ./start.sh"
echo "  仅Socket.IO: ./start.sh socket"
