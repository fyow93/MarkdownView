'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, File, Folder, AlertCircle } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  isExpanded?: boolean;
  size?: number;
}

interface FileTreeProps {
  onFileSelect: (filePath: string) => void;
  selectedFile?: string;
}

const FileTree: React.FC<FileTreeProps> = ({ onFileSelect, selectedFile }) => {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileTree = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/filetree');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setTree(data);
      } catch (err) {
        console.error('Failed to fetch file tree:', err);
        setError(err instanceof Error ? err.message : '获取文件树失败');
        
        // 如果API失败，使用备用的模拟数据
        const fallbackTree: FileNode[] = [
          {
            name: 'projects',
            path: 'projects',
            type: 'directory',
            isExpanded: true,
            children: [
              {
                name: 'InstaForge',
                path: 'projects/InstaForge',
                type: 'directory',
                isExpanded: false,
                children: [
                  {
                    name: 'README.md',
                    path: 'projects/InstaForge/README.md',
                    type: 'file'
                  }
                ]
              }
            ]
          }
        ];
        setTree(fallbackTree);
      } finally {
        setLoading(false);
      }
    };

    fetchFileTree();
  }, []);

  const toggleDirectory = (path: string) => {
    const updateTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === path && node.type === 'directory') {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    
    setTree(updateTree(tree));
  };

  const renderTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map(node => (
      <div key={node.path} className="select-none">
        <div 
          className={`
            flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors
            hover:bg-accent hover:text-accent-foreground
            ${selectedFile === node.path ? 'bg-accent text-accent-foreground' : ''}
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleDirectory(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
        >
          {node.type === 'directory' ? (
            <>
              {node.isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <Folder className="h-4 w-4 text-blue-500" />
            </>
          ) : (
            <>
              <div className="w-4" /> {/* Spacer for alignment */}
              <File className="h-4 w-4 text-gray-500" />
            </>
          )}
          <span className="text-sm truncate">{node.name}</span>
        </div>
        {node.type === 'directory' && node.isExpanded && node.children && (
          <div>
            {renderTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">项目文档</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">正在加载文件树...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">项目文档</CardTitle>
          {error && (
            <div className="flex items-center gap-1 text-amber-600" title={`API连接失败: ${error}`}>
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">离线模式</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-4 pt-0">
            {tree.length > 0 ? renderTree(tree) : (
              <div className="text-center py-8 text-muted-foreground">
                没有找到Markdown文件
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FileTree; 