import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import config from '../../../../../config.js';

// 安全检查函数 - 防止目录遍历攻击
function isValidPath(requestedPath: string, projectRoot: string): boolean {
  const resolvedPath = path.resolve(projectRoot, requestedPath);
  return resolvedPath.startsWith(projectRoot);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  const resolvedParams = await params;
  const requestedFile = resolvedParams.filename.join('/');

  if (!requestedFile) {
    return NextResponse.json({ error: '文件名不能为空' }, { status: 400 });
  }

  // 只允许访问.md文件
  if (!requestedFile.endsWith('.md')) {
    return NextResponse.json({ error: '访问被拒绝：只能访问Markdown文件' }, { status: 403 });
  }

  // 动态获取当前项目根目录
  const PROJECT_ROOT = config.PROJECT_ROOT;
  let filePath: string;

  // 检查是否是示例文件请求或项目根目录不存在
  if (requestedFile === 'example.md' || !fs.existsSync(PROJECT_ROOT)) {
    filePath = path.resolve('./example.md');
  } else {
    // 安全检查
    if (!isValidPath(requestedFile, PROJECT_ROOT)) {
      return NextResponse.json({ error: '访问被拒绝：无效的文件路径' }, { status: 403 });
    }

    filePath = path.join(PROJECT_ROOT, requestedFile);
  }

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: '文件未找到' }, { status: 404 });
  }

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);

    // 移除可能存在的CSS链接引用（在服务器端处理）
    content = content.replace(/<link[^>]*href[^>]*\.css[^>]*>/gi, '');
    content = content.replace(/^\s*<link[^>]*>\s*$/gm, '');

    const response = {
      content: content,
      lastModified: stats.mtime,
      size: stats.size
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: '读取文件失败' }, { status: 500 });
  }
} 