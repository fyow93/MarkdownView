import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 项目根目录
const PROJECT_ROOT = path.resolve('/home/xtalpi/shuaikang.lin/cursor-wks/projects-wiki');

// 安全检查函数 - 防止目录遍历攻击
function isValidPath(requestedPath: string): boolean {
  const resolvedPath = path.resolve(PROJECT_ROOT, requestedPath);
  return resolvedPath.startsWith(PROJECT_ROOT);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  const requestedFile = params.filename.join('/');
  
  if (!requestedFile) {
    return NextResponse.json({ error: '文件名不能为空' }, { status: 400 });
  }
  
  // 安全检查
  if (!isValidPath(requestedFile)) {
    return NextResponse.json({ error: '访问被拒绝：无效的文件路径' }, { status: 403 });
  }
  
  // 只允许访问.md文件
  if (!requestedFile.endsWith('.md')) {
    return NextResponse.json({ error: '访问被拒绝：只能访问Markdown文件' }, { status: 403 });
  }
  
  const filePath = path.join(PROJECT_ROOT, requestedFile);
  
  console.log('Requested file:', requestedFile);
  console.log('Full path:', filePath);
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
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
    
    console.log(`Successfully served file: ${requestedFile} (${stats.size} bytes)`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: '读取文件失败' }, { status: 500 });
  }
} 