#!/bin/bash

echo "🔍 检查 MarkdownView 应用状态..."

# 检查配置
echo "⚙️ 当前配置:"
node -e "
const config = require('./config');
console.log('  项目根路径:', config.PROJECT_ROOT);
console.log('  服务器端口:', config.SERVER.PORT);
console.log('  服务器主机:', config.SERVER.HOST);
console.log('  轮询间隔:', config.WATCH.POLL_INTERVAL + 'ms');
" 2>/dev/null || echo "  ❌ 配置文件加载失败"
echo ""

# 检查服务器是否运行
PORT=$(node -e "console.log(require('./config').SERVER.PORT)" 2>/dev/null || echo "3000")
if curl -s http://localhost:$PORT > /dev/null; then
    echo "✅ 服务器运行正常 (端口 $PORT)"
else
    echo "❌ 服务器未运行或无法访问"
    exit 1
fi

# 检查文件树API
if curl -s http://localhost:$PORT/api/filetree | jq . > /dev/null 2>&1; then
    echo "✅ 文件树 API 正常"
else
    echo "❌ 文件树 API 异常"
fi

# 检查文件内容API（优先检查示例文件）
if curl -s "http://localhost:$PORT/api/file/example.md" | jq . > /dev/null 2>&1; then
    echo "✅ 文件内容 API 正常 (示例文件)"
elif curl -s "http://localhost:$PORT/api/file/README.md" | jq . > /dev/null 2>&1; then
    echo "✅ 文件内容 API 正常 (项目文件)"
else
    echo "❌ 文件内容 API 异常"
fi

# 检查页面标题
TITLE=$(curl -s http://localhost:$PORT | grep -o "Projects Wiki Viewer" | head -1)
if [ "$TITLE" = "Projects Wiki Viewer" ]; then
    echo "✅ 页面标题正确"
else
    echo "❌ 页面标题异常"
fi

# 检查样式加载
STYLES=$(curl -s http://localhost:$PORT | grep -o "class=\"[^\"]*\"" | grep -E "bg-|border|rounded|flex|text-" | wc -l)
if [ "$STYLES" -gt 20 ]; then
    echo "✅ 样式类正常加载 ($STYLES 个样式类)"
else
    echo "⚠️  样式类加载可能有问题 ($STYLES 个样式类)"
fi

echo ""
echo "🎯 功能特性："
echo "   • 实时文件监控 (轮询模式，每3秒检查)"
echo "   • 位置记忆功能 (自动保存/恢复滚动位置)"
echo "   • 响应式设计 (桌面/移动端适配)"
echo "   • Markdown渲染 (支持代码高亮、Mermaid图表)"
echo "   • 文件选择记忆 (页面刷新后恢复)"
echo ""
echo "✨ 应用状态检查完成！" 