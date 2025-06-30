#!/bin/bash

# Projects Wiki Markdown Viewer 启动脚本
# 迁移位置: /home/xtalpi/shuaikang.lin/cursor-wks/MarkdownView

echo "🚀 启动 Projects Wiki Markdown Viewer..."
echo "📂 项目位置: $(pwd)"
echo "📖 查看项目: /home/xtalpi/shuaikang.lin/cursor-wks/projects-wiki"
echo ""

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

echo "🌐 启动服务器..."
echo "   - 后端服务: http://localhost:3001"
echo "   - 前端服务: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 启动开发服务
npm run dev 