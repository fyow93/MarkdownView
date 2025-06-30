import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 项目根目录
const PROJECT_ROOT = path.resolve('/home/xtalpi/shuaikang.lin/cursor-wks/projects-wiki');

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
}

// 安全检查函数 - 防止目录遍历攻击
function isValidPath(requestedPath: string): boolean {
  const resolvedPath = path.resolve(PROJECT_ROOT, requestedPath);
  return resolvedPath.startsWith(PROJECT_ROOT);
}

// 递归获取目录结构
function getDirectoryStructure(dirPath: string, relativePath: string = ''): FileNode[] {
  const items: FileNode[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // 跳过隐藏文件和特定目录
      if (entry.name.startsWith('.') || 
          entry.name === 'node_modules' || 
          entry.name === 'dist' || 
          entry.name === 'build') {
        continue;
      }
      
      const itemPath = path.join(dirPath, entry.name);
      const itemRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        const children = getDirectoryStructure(itemPath, itemRelativePath);
        if (children.length > 0 || entry.name.endsWith('-test') || entry.name.includes('example')) {
          items.push({
            name: entry.name,
            type: 'directory',
            path: itemRelativePath,
            children: children
          });
        }
      } else if (entry.name.endsWith('.md')) {
        items.push({
          name: entry.name,
          type: 'file',
          path: itemRelativePath,
          size: fs.statSync(itemPath).size
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export async function GET() {
  try {
    console.log('Fetching file tree from:', PROJECT_ROOT);
    const tree = getDirectoryStructure(PROJECT_ROOT);
    return NextResponse.json(tree);
  } catch (error) {
    console.error('Error generating file tree:', error);
    return NextResponse.json({ error: '生成文件树失败' }, { status: 500 });
  }
} 