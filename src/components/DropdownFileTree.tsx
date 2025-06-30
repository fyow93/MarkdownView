'use client';

import React, { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  ChevronRight,
  FolderTree,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
  size?: number;
}

// 下拉菜单文件树组件
export const DropdownFileTree: React.FC<{
  onFileSelect: (filePath: string) => void;
  selectedFile: string;
}> = ({ onFileSelect, selectedFile }) => {
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const locale = useLocale();
  const t = useTranslations('FileTree');
  
  // 计算文件总数，用于动态调整高度
  const countFiles = (items: FileTreeItem[]): number => {
    let count = 0;
    for (const item of items) {
      if (item.type === 'file') {
        count++;
      } else if (item.children && expandedDirs.has(item.path)) {
        count += countFiles(item.children);
      }
      count++; // 每个项目（文件或文件夹）都算一个
    }
    return count;
  };

  useEffect(() => {
    const fetchFileTree = async () => {
      try {
        const response = await fetch(`/${locale}/api/filetree`);
        if (response.ok) {
          const data = await response.json();
          setFileTree(data);
        }
      } catch (error) {
        console.error('获取文件树失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFileTree();
  }, [locale]);

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const renderFileTree = (items: FileTreeItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.path}>
        {item.type === 'directory' ? (
          <div>
            <button
              onClick={() => toggleDirectory(item.path)}
              className="w-full text-left py-2 px-3 hover:bg-muted/50 rounded-md transition-colors flex items-center gap-2"
              style={{ paddingLeft: `${level * 16 + 12}px` }}
            >
              {expandedDirs.has(item.path) ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
              <FolderTree className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-foreground">{item.name}</span>
            </button>
            {expandedDirs.has(item.path) && item.children && (
              <div className="mt-1">
                {renderFileTree(item.children, level + 1)}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              onFileSelect(item.path);
              setIsOpen(false);
            }}
            className={`
              w-full text-left py-2 px-3 rounded-md text-sm transition-colors
              flex items-center gap-2 hover:bg-primary/10
              ${selectedFile === item.path ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}
            `}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            <FileText className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{item.name}</span>
          </button>
        )}
      </div>
    ));
  };

  // 计算当前显示的项目数量（考虑展开状态）
  const getVisibleItemCount = (items: FileTreeItem[]): number => {
    let count = 0;
    for (const item of items) {
      count++; // 当前项目
      if (item.type === 'directory' && item.children && expandedDirs.has(item.path)) {
        count += getVisibleItemCount(item.children);
      }
    }
    return count;
  };

  const visibleItemCount = getVisibleItemCount(fileTree);
  const maxHeight = typeof window !== 'undefined' ? window.innerHeight * 0.7 : 500;
  const estimatedHeight = Math.min(visibleItemCount * 40 + 80, maxHeight); // 每项约40px高度，最大70vh

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="gap-2 bg-background/95 backdrop-blur-sm border-primary/20"
      >
        <FolderTree className="h-4 w-4 text-primary" />
        <span className="text-sm">{t('fileTree')}</span>
        {fileTree.length > 0 && (
          <Badge variant="secondary" className="text-xs ml-1">
            {fileTree.filter(item => item.type === 'file').length + 
             fileTree.filter(item => item.type === 'directory').reduce((acc, dir) => 
               acc + (dir.children?.filter(child => child.type === 'file').length || 0), 0)}
          </Badge>
        )}
        {isOpen ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card 
            className="absolute top-full left-0 mt-2 w-80 z-50 bg-background/95 backdrop-blur-sm border-primary/20 shadow-lg"
            style={{ maxHeight: `${Math.min(estimatedHeight, maxHeight)}px` }}
          >
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{t('fileTree')}</span>
                {fileTree.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {visibleItemCount} 项
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                </div>
              ) : fileTree.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">{t('noFiles')}</div>
                  </div>
                </div>
              ) : (
                <div className="overflow-y-auto" style={{ maxHeight: `${Math.min(estimatedHeight - 80, maxHeight * 0.85)}px` }}>
                  <div className="p-2">
                    {renderFileTree(fileTree)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}; 