'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, FileText, Code, Image, Settings, Database, Zap, XCircle, RotateCcw } from 'lucide-react';

interface FileTab {
  path: string;
  name: string;
  isActive: boolean;
}

interface FileTabsProps {
  selectedFile: string;
  onFileSelect: (filePath: string) => void;
}

const FileTabs: React.FC<FileTabsProps> = ({ selectedFile, onFileSelect }) => {
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [recentlyClosedTabs, setRecentlyClosedTabs] = useState<FileTab[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const t = useTranslations('Navigation');

  // 切换到指定标签页
  const switchToTab = (path: string) => {
    onFileSelect(path);
  };

  // 关闭标签页
  const closeTab = (pathToClose: string, e: React.MouseEvent) => {
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
      } catch (error) {
        console.error('Failed to save recent tabs:', error);
      }
      
      return newTabs;
    });
  };

  // 恢复最近关闭的标签页
  const restoreRecentTab = () => {
    if (recentlyClosedTabs.length > 0) {
      const tabToRestore = recentlyClosedTabs[0];
      setRecentlyClosedTabs(prev => prev.slice(1));
      onFileSelect(tabToRestore.path);
    }
  };

  // 清除所有标签页
  const closeAllTabs = () => {
    setTabs([]);
    try {
      localStorage.removeItem('recent-file-tabs');
    } catch (error) {
      console.error('Failed to clear recent tabs:', error);
    }
  };

  // 拖拽处理函数
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // 必须设置数据，否则在某些浏览器中拖拽不生效
    
    // 设置拖拽图像为半透明
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
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
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
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
      } catch (error) {
        console.error('Failed to save reordered tabs:', error);
      }
      
      return newTabs;
    });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // 恢复透明度
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  // 防止拖拽时触发点击事件
  const handleTabClick = (path: string, e: React.MouseEvent) => {
    if (!isDragging) {
      switchToTab(path);
    }
  };

  // 从localStorage加载最近打开的文件
  useEffect(() => {
    try {
      const savedTabs = localStorage.getItem('recent-file-tabs');
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        setTabs(parsedTabs);
      }
    } catch (error) {
      console.error('Failed to load recent tabs:', error);
    }
  }, []);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + W: 关闭当前标签页
      if (e.ctrlKey && e.key === 'w' && tabs.length > 0) {
        e.preventDefault();
        const activeTab = tabs.find(tab => tab.isActive);
        if (activeTab) {
          const fakeEvent = { stopPropagation: () => {} } as React.MouseEvent;
          closeTab(activeTab.path, fakeEvent);
        }
      }
      
      // Ctrl + Tab: 切换到下一个标签页
      if (e.ctrlKey && e.key === 'Tab' && tabs.length > 1) {
        e.preventDefault();
        const activeIndex = tabs.findIndex(tab => tab.isActive);
        const nextIndex = (activeIndex + 1) % tabs.length;
        switchToTab(tabs[nextIndex].path);
      }
      
      // Ctrl + Shift + Tab: 切换到上一个标签页
      if (e.ctrlKey && e.shiftKey && e.key === 'Tab' && tabs.length > 1) {
        e.preventDefault();
        const activeIndex = tabs.findIndex(tab => tab.isActive);
        const prevIndex = activeIndex === 0 ? tabs.length - 1 : activeIndex - 1;
        switchToTab(tabs[prevIndex].path);
      }
      
      // Ctrl + Shift + T: 恢复最近关闭的标签页
      if (e.ctrlKey && e.shiftKey && e.key === 'T' && recentlyClosedTabs.length > 0) {
        e.preventDefault();
        restoreRecentTab();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tabs, recentlyClosedTabs]);

  // 当选中文件变化时，更新标签页
  useEffect(() => {
    if (!selectedFile) return;

    const fileName = selectedFile.split('/').pop() || selectedFile;
    
    setTabs(prevTabs => {
      // 检查文件是否已经在标签页中
      const existingTabIndex = prevTabs.findIndex(tab => tab.path === selectedFile);
      
      let newTabs: FileTab[];
      
      if (existingTabIndex !== -1) {
        // 如果已存在，只更新激活状态
        newTabs = prevTabs.map((tab, index) => ({
          ...tab,
          isActive: index === existingTabIndex
        }));
      } else {
        // 如果不存在，添加新标签页
        newTabs = [
          ...prevTabs.map(tab => ({ ...tab, isActive: false })),
          {
            path: selectedFile,
            name: fileName,
            isActive: true
          }
        ];
        
        // 限制最多显示10个标签页
        if (newTabs.length > 10) {
          newTabs = newTabs.slice(-10);
        }
      }
      
      // 保存到localStorage
      try {
        localStorage.setItem('recent-file-tabs', JSON.stringify(newTabs));
      } catch (error) {
        console.error('Failed to save recent tabs:', error);
      }
      
      return newTabs;
    });
  }, [selectedFile]);

  // 获取文件类型图标
  const getFileIcon = (fileName: string) => {
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
        return <Image className="h-3 w-3 text-purple-500" />;
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
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-card/95 backdrop-blur-sm">
      <ScrollArea className="w-full">
        <div className="flex items-center gap-0.5 px-4 py-1.5 min-h-[2.5rem] relative">
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
                transition-all duration-200 min-w-0 max-w-[200px] select-none
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
              onClick={(e) => handleTabClick(tab.path, e)}
              title={`${tab.path} - ${t('dragToReorder')}`}
            >
              {getFileIcon(tab.name)}
              <span className="text-sm truncate font-medium">
                {tab.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive rounded-full opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity ml-auto"
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
};

export default FileTabs; 