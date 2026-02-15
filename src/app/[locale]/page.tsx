'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import MarkdownViewer from '@/components/MarkdownViewer';
import { DropdownFileTree } from '@/components/DropdownFileTree';
import { DirectorySelector } from '@/components/DirectorySelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import GitHubStar from '@/components/GitHubStar';
import FileTabs from '@/components/FileTabs';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { Button } from '@/components/ui/button';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Settings, HelpCircle } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [showDirectorySelector, setShowDirectorySelector] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const t = useTranslations('Navigation');
  const { setOnFileSelect } = useSearch();

  // Handle search result file selection - loads file via API
  const handleSearchResultSelect = useCallback((sessionId: string, relativePath: string) => {
    // Construct the API path for the session file
    const apiPath = `/api/copilot-sessions/file/${sessionId}/${relativePath}`;
    setSelectedFile(apiPath);
    localStorage.setItem('last-selected-file', apiPath);
  }, []);

  // Register the search result handler
  useEffect(() => {
    setOnFileSelect(handleSearchResultSelect);
    return () => setOnFileSelect(null);
  }, [setOnFileSelect, handleSearchResultSelect]);

  // 从localStorage恢复用户状态
  useEffect(() => {
    const restoreUserState = async () => {
      try {
        // 恢复保存的目录
        const savedDirectory = localStorage.getItem('last-selected-directory');
        if (savedDirectory) {
          // 尝试设置保存的目录
          const response = await fetch(`/api/config/project-root`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectRoot: savedDirectory })
          });
          
          if (response.ok) {
            setRefreshKey(prev => prev + 1); // 触发文件树刷新
            
            // 恢复保存的文件（在目录设置成功后）
            setTimeout(() => {
              const savedFile = localStorage.getItem('last-selected-file');
              if (savedFile) {
                setSelectedFile(savedFile);
              }
            }, 500);
          } else {
            // 无法设置保存的目录，使用默认目录
            localStorage.removeItem('last-selected-directory');
          }
        } else {
          // 没有保存的目录，仍然尝试恢复文件
          const savedFile = localStorage.getItem('last-selected-file');
          if (savedFile) {
            setSelectedFile(savedFile);
          }
        }
      } catch {
        // 恢复用户状态失败，静默处理
      }
    };

    restoreUserState();
  }, []);

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    // 保存最后选中的文件
    localStorage.setItem('last-selected-file', filePath);
  };

  // 处理目录更改
  const handleDirectoryChange = (newPath: string) => {
    // 保存新目录到localStorage
    localStorage.setItem('last-selected-directory', newPath);
    
    // 刷新文件树
    setRefreshKey(prev => prev + 1);
    
    // 清空当前选中的文件（因为目录变了，之前的文件可能不存在了）
    setSelectedFile('');
    localStorage.removeItem('last-selected-file');
  };

  useKeyboardShortcuts({
    enabled: true,
    onShowHelp: () => setShowKeyboardHelp(true),
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{t('title')}</h1>
            {/* 更改目录按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDirectorySelector(true)}
              className="gap-2 bg-background/95 backdrop-blur-sm border-primary/20"
            >
              <Settings className="h-4 w-4 text-primary" />
              <span className="text-sm">{t('changeDirectory')}</span>
            </Button>
            {/* 项目文档下拉菜单 */}
            <DropdownFileTree
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              refreshTrigger={refreshKey}
            />
          </div>
           <div className="flex items-center gap-2">
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setShowKeyboardHelp(true)}
               title="Keyboard shortcuts (? or Ctrl+/)"
               className="gap-2"
             >
               <HelpCircle className="h-4 w-4" />
               <span className="sr-only">Help</span>
             </Button>
             <ThemeToggle />
             <LanguageToggle />
             <GitHubStar repoUrl="https://github.com/fyow93/MarkdownView" />
           </div>
        </div>
      </header>

      {/* File Tabs */}
      <FileTabs 
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
      />

      {/* Main Content */}
      <div className="flex-1">
        <MarkdownViewer 
          filePath={selectedFile}
          onFileSelect={handleFileSelect}
        />
      </div>

       {/* 目录选择器 */}
       <DirectorySelector
         isOpen={showDirectorySelector}
         onClose={() => setShowDirectorySelector(false)}
         onDirectorySelect={handleDirectoryChange}
       />

       {/* 键盘快捷键帮助 */}
       <KeyboardShortcutsHelp
         open={showKeyboardHelp}
         onOpenChange={setShowKeyboardHelp}
       />
     </div>
   );
 } 