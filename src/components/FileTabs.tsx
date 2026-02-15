'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, FileText, Code, Image as ImageIcon, Settings, Database, Zap, XCircle, RotateCcw } from 'lucide-react';

interface FileTab {
  path: string;
  name: string;
  isActive: boolean;
}

interface FileTabsProps {
  selectedFile: string;
  onFileSelect: (filePath: string) => void;
}

const FileTabs: React.FC<FileTabsProps> = React.memo(({ selectedFile, onFileSelect }) => {
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [recentlyClosedTabs, setRecentlyClosedTabs] = useState<FileTab[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const t = useTranslations('Navigation');

  const switchToTab = useCallback((path: string) => {
    onFileSelect(path);
  }, [onFileSelect]);

  const closeTab = useCallback((pathToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setTabs(prevTabs => {
      const closedTab = prevTabs.find(tab => tab.path === pathToClose);
      const newTabs = prevTabs.filter(tab => tab.path !== pathToClose);
      
      // 保存到最近关闭的标签页
      if (closedTab) {
        setRecentlyClosedTabs(prev => {
          const updated = [closedTab, ...prev.filter(tab => tab.path !== pathToClose)];
          return updated.slice(0, 5); // 只保留最近的5个
        });
      }
      
      // 如果关闭的是当前活跃的标签页，需要激活另一个标签页
      const wasActive = prevTabs.find(tab => tab.path === pathToClose)?.isActive;
      if (wasActive && newTabs.length > 0) {
        // 找到被关闭标签页的索引
        const closedTabIndex = prevTabs.findIndex(tab => tab.path === pathToClose);
        // 优先激活右侧的标签页，如果没有则激活左侧的
        const nextActiveIndex = closedTabIndex < newTabs.length ? closedTabIndex : newTabs.length - 1;
        newTabs[nextActiveIndex].isActive = true;
        onFileSelect(newTabs[nextActiveIndex].path);
      }
      
      // 保存到localStorage
      try {
        localStorage.setItem('recent-file-tabs', JSON.stringify(newTabs));
      } catch {
        // Silently handle save failure
      }
      
      return newTabs;
    });
  }, [onFileSelect]);

  const restoreRecentTab = useCallback(() => {
    if (recentlyClosedTabs.length > 0) {
      const tabToRestore = recentlyClosedTabs[0];
      setRecentlyClosedTabs(prev => prev.slice(1));
      onFileSelect(tabToRestore.path);
    }
  }, [recentlyClosedTabs, onFileSelect]);

  const tabsRef = useRef<FileTab[]>(tabs);
  const recentlyClosedTabsRef = useRef<FileTab[]>(recentlyClosedTabs);
  const closeTabRef = useRef(closeTab);
  const switchToTabRef = useRef(switchToTab);
  const restoreRecentTabRef = useRef(restoreRecentTab);

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  useEffect(() => {
    recentlyClosedTabsRef.current = recentlyClosedTabs;
  }, [recentlyClosedTabs]);

  useEffect(() => {
    closeTabRef.current = closeTab;
  }, [closeTab]);

  useEffect(() => {
    switchToTabRef.current = switchToTab;
  }, [switchToTab]);

  useEffect(() => {
    restoreRecentTabRef.current = restoreRecentTab;
  }, [restoreRecentTab]);

  const closeAllTabs = useCallback(() => {
    setTabs([]);
    try {
      localStorage.removeItem('recent-file-tabs');
    } catch {
      // Silently handle clear failure
    }
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // 必须设置数据，否则在某些浏览器中拖拽不生效
    
    // 设置拖拽图像为半透明
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index) {
      // 计算鼠标在元素中的位置，决定是插入到左边还是右边
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX;
      const elementCenter = rect.left + rect.width / 2;
      
      // 如果鼠标在元素左半部分，插入到当前位置；右半部分插入到下一位置
      const insertIndex = mouseX < elementCenter ? index : index + 1;
      setDragOverIndex(insertIndex);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) {
      return;
    }

    // 使用dragOverIndex来确定实际的插入位置
    const actualDropIndex = dragOverIndex !== null ? dragOverIndex : dropIndex;
    
    if (draggedIndex === actualDropIndex) {
      return;
    }

    setTabs(prevTabs => {
      const newTabs = [...prevTabs];
      const draggedTab = newTabs[draggedIndex];
      
      // 移除被拖拽的标签页
      newTabs.splice(draggedIndex, 1);
      
      // 计算正确的插入位置
      let insertIndex = actualDropIndex;
      if (draggedIndex < actualDropIndex) {
        insertIndex = actualDropIndex - 1;
      }
      
      // 确保插入位置在有效范围内
      insertIndex = Math.max(0, Math.min(insertIndex, newTabs.length));
      
      // 在新位置插入
      newTabs.splice(insertIndex, 0, draggedTab);
      
      // 保存到localStorage
      try {
        localStorage.setItem('recent-file-tabs', JSON.stringify(newTabs));
      } catch {
        // Silently handle save failure
      }
      
      return newTabs;
    });
  }, [draggedIndex, dragOverIndex]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    // 恢复透明度
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  }, []);

  const handleTabClick = useCallback((path: string) => {
    if (!isDragging) {
      switchToTab(path);
    }
  }, [isDragging, switchToTab]);

  const getFileIcon = useCallback((fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'md':
      case 'markdown':
        return <FileText className="h-3 w-3 text-blue-500" />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'vue':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'go':
      case 'rs':
        return <Code className="h-3 w-3 text-green-500" />;
      case 'json':
      case 'yaml':
      case 'yml':
      case 'toml':
      case 'xml':
        return <Settings className="h-3 w-3 text-orange-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return <ImageIcon className="h-3 w-3 text-purple-500" />;
      case 'sql':
      case 'db':
        return <Database className="h-3 w-3 text-cyan-500" />;
      case 'html':
      case 'css':
      case 'scss':
      case 'sass':
        return <Zap className="h-3 w-3 text-yellow-500" />;
      default:
        return <FileText className="h-3 w-3 text-gray-500" />;
    }
  }, []);

  useEffect(() => {
    try {
      const savedTabs = localStorage.getItem('recent-file-tabs');
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        setTabs(parsedTabs);
      }
    } catch {
      // Silently handle load failure
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const currentTabs = tabsRef.current;
    const currentRecentTabs = recentlyClosedTabsRef.current;

    if (e.ctrlKey && e.key === 'w' && currentTabs.length > 0) {
      e.preventDefault();
      const activeTab = currentTabs.find(tab => tab.isActive);
      if (activeTab) {
        const fakeEvent = { stopPropagation: () => {} } as React.MouseEvent;
        closeTabRef.current(activeTab.path, fakeEvent);
      }
    }
    
    if (e.ctrlKey && e.key === 'Tab' && currentTabs.length > 1) {
      e.preventDefault();
      const activeIndex = currentTabs.findIndex(tab => tab.isActive);
      const nextIndex = (activeIndex + 1) % currentTabs.length;
      switchToTabRef.current(currentTabs[nextIndex].path);
    }
    
    if (e.ctrlKey && e.shiftKey && e.key === 'Tab' && currentTabs.length > 1) {
      e.preventDefault();
      const activeIndex = currentTabs.findIndex(tab => tab.isActive);
      const prevIndex = activeIndex === 0 ? currentTabs.length - 1 : activeIndex - 1;
      switchToTabRef.current(currentTabs[prevIndex].path);
    }
    
    if (e.ctrlKey && e.shiftKey && e.key === 'T' && currentRecentTabs.length > 0) {
      e.preventDefault();
      restoreRecentTabRef.current();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!selectedFile) return;

    const fileName = selectedFile.split('/').pop() || selectedFile;
    
    setTabs(prevTabs => {
      const existingTabIndex = prevTabs.findIndex(tab => tab.path === selectedFile);
      
      let newTabs: FileTab[];
      
      if (existingTabIndex !== -1) {
        newTabs = prevTabs.map((tab, index) => ({
          ...tab,
          isActive: index === existingTabIndex
        }));
      } else {
        newTabs = [
          ...prevTabs.map(tab => ({ ...tab, isActive: false })),
          {
            path: selectedFile,
            name: fileName,
            isActive: true
          }
        ];
        
        if (newTabs.length > 10) {
          newTabs = newTabs.slice(-10);
        }
      }
      
      try {
        localStorage.setItem('recent-file-tabs', JSON.stringify(newTabs));
      } catch {
        // Silently handle save failure
      }
      
      return newTabs;
    });
  }, [selectedFile]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-card/95 backdrop-blur-sm">
      <ScrollArea className="w-full">
        <div className="flex items-center gap-0.5 px-4 py-1.5 min-h-10 relative">
          {tabs.map((tab, index) => (
            <React.Fragment key={tab.path}>
              {/* 插入指示器 */}
              {dragOverIndex === index && isDragging && (
                <div className="w-1 h-8 bg-primary rounded-full shadow-lg animate-pulse" />
              )}
                          <div
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                group relative flex items-center gap-2 px-3 py-1.5 cursor-pointer
                transition-all duration-200 min-w-0 max-w-50 select-none
                ${tab.isActive 
                  ? 'bg-background/95 text-foreground shadow-sm border-b-2 border-primary' 
                  : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                }
                ${index === 0 ? 'rounded-tl-md' : ''}
                ${index === tabs.length - 1 ? 'rounded-tr-md' : ''}
                ${draggedIndex === index ? 'opacity-50 scale-95 z-10' : ''}
                ${isDragging && draggedIndex !== index ? 'hover:bg-primary/20 transition-transform hover:scale-105' : ''}
                ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
              `}
              onClick={() => handleTabClick(tab.path)}
              title={`${tab.path} - ${t('dragToReorder')}`}
            >
              {getFileIcon(tab.name)}
              <span className="text-sm truncate font-medium">
                {tab.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive rounded-full opacity-0 group-hover:opacity-70 hover:opacity-100! transition-opacity ml-auto"
                onClick={(e) => closeTab(tab.path, e)}
                title={t('closeTab')}
                onMouseDown={(e) => e.stopPropagation()} // 防止拖拽时触发关闭
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {/* 最后一个位置的插入指示器 */}
            {dragOverIndex === tabs.length && isDragging && (
              <div className="w-1 h-8 bg-primary rounded-full shadow-lg animate-pulse" />
            )}
            </React.Fragment>
          ))}
          {tabs.length > 0 && (
            <div className="flex items-center ml-3 gap-2 border-l border-border/50 pl-3">
              <div className="text-xs text-muted-foreground font-medium">
                <span>{tabs.length} {tabs.length === 1 ? 'file' : 'files'}</span>
              </div>
              {recentlyClosedTabs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-primary/20 hover:text-primary rounded-full opacity-60 hover:opacity-100 transition-opacity"
                  onClick={restoreRecentTab}
                  title={`${t('restoreTab')} (Ctrl+Shift+T)`}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive rounded-full opacity-60 hover:opacity-100 transition-opacity"
                onClick={closeAllTabs}
                title={t('closeAllTabs')}
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

FileTabs.displayName = 'FileTabs';

export default FileTabs; 
