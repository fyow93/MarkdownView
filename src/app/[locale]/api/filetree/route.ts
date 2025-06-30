import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import config from '../../../../../config.js';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
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
        // 显示所有目录，不管是否包含文件
        items.push({
          name: entry.name,
          type: 'directory',
          path: itemRelativePath,
          children: children
        });
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
    // 动态获取当前项目根目录
    const PROJECT_ROOT = config.PROJECT_ROOT;
    console.log('Fetching file tree from:', PROJECT_ROOT);

    // 检查项目根目录是否存在
    if (!fs.existsSync(PROJECT_ROOT)) {
      console.log('Project root not found, using example file');
      // 返回示例文件结构
      return NextResponse.json([
        {
          name: 'example.md',
          type: 'file',
          path: 'example.md',
          size: fs.statSync(path.resolve('./example.md')).size
        }
      ]);
    }

    const tree = getDirectoryStructure(PROJECT_ROOT);
    return NextResponse.json(tree);
  } catch (error) {
    console.error('Error generating file tree:', error);
    return NextResponse.json({ error: '生成文件树失败' }, { status: 500 });
  }
}