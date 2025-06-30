#!/bin/bash

echo "🔍 检查 MarkdownView 应用状态..."

# 检查服务器是否运行
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 服务器运行正常 (端口 3000)"
else
    echo "❌ 服务器未运行或无法访问"
    exit 1
fi

# 检查文件树API
if curl -s http://localhost:3000/api/filetree | jq . > /dev/null 2>&1; then
    echo "✅ 文件树 API 正常"
else
    echo "❌ 文件树 API 异常"
fi

# 检查文件内容API
if curl -s "http://localhost:3000/api/file/README.md" | jq . > /dev/null 2>&1; then
    echo "✅ 文件内容 API 正常"
else
    echo "❌ 文件内容 API 异常"
fi

# 检查页面标题
TITLE=$(curl -s http://localhost:3000 | grep -o "Projects Wiki Viewer" | head -1)
if [ "$TITLE" = "Projects Wiki Viewer" ]; then
    echo "✅ 页面标题正确"
else
    echo "❌ 页面标题异常"
fi

# 检查样式加载
STYLES=$(curl -s http://localhost:3000 | grep -o "class=\"[^\"]*\"" | grep -E "bg-|border|rounded|flex|text-" | wc -l)
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