'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
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

export const DropdownFileTree: React.FC<{
  onFileSelect: (filePath: string) => void;
  selectedFile: string;
  refreshTrigger?: number;
}> = React.memo(({ onFileSelect, selectedFile, refreshTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const t = useTranslations('FileTree');

  const fetchFileTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/filetree`);
      const data = await response.json();
      
      if (response.ok) {
        // API返回的是数组，直接使用
        setFileTree(Array.isArray(data) ? data : []);
      } else {
        setError(data.error || t('error'));
      }
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const renderFileTree = useCallback((items: FileTreeItem[], level = 0) => {
    return items.map((item, index) => {
      const isDirectory = item.type === 'directory';
      const isExpanded = expandedDirs.has(item.path);
      const isSelected = !isDirectory && selectedFile === item.path;
      
      return (
        <div key={`${item.path}-${index}`} className="space-y-0.5">
          <div
            className={`flex items-center px-2 py-1 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${
              isSelected ? 'bg-accent text-accent-foreground' : ''
            }`}
            style={{ paddingLeft: `${level * 12 + 6}px` }}
            onClick={() => {
              if (isDirectory) {
                setExpandedDirs(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(item.path)) {
                    newSet.delete(item.path);
                  } else {
                    newSet.add(item.path);
                  }
                  try {
                    localStorage.setItem('filetree-expanded-dirs', JSON.stringify(Array.from(newSet)));
                  } catch {
                    // Silently handle save failure
                  }
                  return newSet;
                });
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
            <div className="ml-1">
              {renderFileTree(item.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  }, [expandedDirs, selectedFile, onFileSelect]);

  const getVisibleItemCount = useMemo(() => {
    const countRecursive = (items: FileTreeItem[]): number => {
      let count = 0;
      items.forEach(item => {
        count++;
        if (item.type === 'directory' && expandedDirs.has(item.path) && item.children) {
          count += countRecursive(item.children);
        }
      });
      return count;
    };
    return countRecursive(fileTree);
  }, [fileTree, expandedDirs]);

  const loadExpandedDirs = useCallback(() => {
    try {
      const saved = localStorage.getItem('filetree-expanded-dirs');
      if (saved) {
        const dirs = JSON.parse(saved);
        if (Array.isArray(dirs)) {
          setExpandedDirs(new Set(dirs));
        }
      }
    } catch {
      // Silently handle load failure
    }
  }, []);

  useEffect(() => {
    fetchFileTree();
    
    if (refreshTrigger === 0) {
      loadExpandedDirs();
    }
  }, [refreshTrigger, fetchFileTree, loadExpandedDirs]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      setExpandedDirs(new Set());
      setIsOpen(false);
      localStorage.removeItem('filetree-expanded-dirs');
    }
  }, [refreshTrigger]);

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
        {getVisibleItemCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {getVisibleItemCount}
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
            <CardContent className="p-2">
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
                  <div className="space-y-0.5 max-h-64 overflow-y-auto">
                    {renderFileTree(fileTree)}
                  </div>
                )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
});

DropdownFileTree.displayName = 'DropdownFileTree'; 