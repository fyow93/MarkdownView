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
  ChevronUp,
  Folder,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
  size?: number;
}

// 主要的文件树下拉组件
export const DropdownFileTree: React.FC<{
  onFileSelect: (filePath: string) => void;
  selectedFile: string;
  refreshTrigger?: number;
}> = ({ onFileSelect, selectedFile, refreshTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [projectRoot, setProjectRoot] = useState<string>('');
  const locale = useLocale();
  const t = useTranslations('FileTree');

  // 获取当前项目根目录
  const fetchCurrentProjectRoot = async () => {
    try {
      const response = await fetch(`/${locale}/api/config/project-root`);
      if (response.ok) {
        const data = await response.json();
        setProjectRoot(data.projectRoot || '');
      }
    } catch (error) {
      console.error('Failed to fetch current project root:', error);
    }
  };

  // 获取文件树
  const fetchFileTree = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/${locale}/api/filetree`);
      const data = await response.json();
      
      if (response.ok) {
        setFileTree(data.files || []);
        setProjectRoot(data.projectRoot || '');
      } else {
        setError(data.error || t('error'));
      }
    } catch (err) {
      setError(t('error'));
      console.error('Failed to fetch file tree:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDirectory = (path: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderFileTree = (items: FileTreeItem[], level = 0) => {
    return items.map((item, index) => {
      const isDirectory = item.type === 'directory';
      const isExpanded = expandedDirs.has(item.path);
      const isSelected = !isDirectory && selectedFile === item.path;
      
      return (
        <div key={`${item.path}-${index}`} className="space-y-1">
          <div
            className={`flex items-center p-2 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${
              isSelected ? 'bg-accent text-accent-foreground' : ''
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              if (isDirectory) {
                toggleDirectory(item.path);
              } else {
                onFileSelect(item.path);
                setIsOpen(false);
              }
            }}
          >
            {isDirectory ? (
              <>
                <ChevronRight 
                  className={`h-4 w-4 mr-1 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`} 
                />
                <Folder className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm font-medium">{item.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.children?.length || 0}
                </Badge>
              </>
            ) : (
              <>
                <div className="w-4 mr-1" />
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">{item.name}</span>
              </>
            )}
          </div>
          
          {isDirectory && isExpanded && item.children && (
            <div className="ml-2">
              {renderFileTree(item.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const getVisibleItemCount = (items: FileTreeItem[]): number => {
    let count = 0;
    items.forEach(item => {
      count++;
      if (item.type === 'directory' && expandedDirs.has(item.path) && item.children) {
        count += getVisibleItemCount(item.children);
      }
    });
    return count;
  };

  // 初始化和依赖项变化时重新获取
  useEffect(() => {
    fetchCurrentProjectRoot();
    fetchFileTree();
  }, [refreshTrigger]);

  // 确保在挂载时清空展开状态，避免旧状态影响新目录
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      setExpandedDirs(new Set());
      setIsOpen(false);
    }
  }, [refreshTrigger]);

  const visibleCount = getVisibleItemCount(fileTree);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 bg-background/95 backdrop-blur-sm border-primary/20"
      >
        <FolderTree className="h-4 w-4 text-primary" />
        <span className="text-sm">{t('fileTree')}</span>
        {visibleCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {visibleCount}
          </Badge>
        )}
        {isOpen ? (
          <ChevronUp className="h-3 w-3 ml-1" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-1" />
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <Card className="absolute top-full left-0 mt-2 w-80 max-h-96 z-50 bg-background/95 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{t('fileTree')}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchFileTree}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {/* 显示当前目录路径 */}
              {projectRoot && (
                <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                  {projectRoot}
                </div>
              )}
            </CardHeader>
            
            <CardContent className="p-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  {t('loading')}
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8 text-destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              ) : fileTree.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">{t('noFiles')}</div>
                </div>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {renderFileTree(fileTree)}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}; 