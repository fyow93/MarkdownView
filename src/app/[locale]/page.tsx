'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import MarkdownViewer from '@/components/MarkdownViewer';
import { DropdownFileTree } from '@/components/DropdownFileTree';
import { DirectorySelector } from '@/components/DirectorySelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import GitHubStar from '@/components/GitHubStar';
import FileTabs from '@/components/FileTabs';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [showDirectorySelector, setShowDirectorySelector] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentDirectory, setCurrentDirectory] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const t = useTranslations('Navigation');

  // 从localStorage恢复用户状态
  useEffect(() => {
    const restoreUserState = async () => {
      try {
        // 恢复保存的目录
        const savedDirectory = localStorage.getItem('last-selected-directory');
        if (savedDirectory) {
          console.log('📁 恢复最后选择的目录:', savedDirectory);
          // 尝试设置保存的目录
          const response = await fetch(`/api/config/project-root`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectRoot: savedDirectory })
          });
          
          if (response.ok) {
            setCurrentDirectory(savedDirectory);
            setRefreshKey(prev => prev + 1); // 触发文件树刷新
            
            // 恢复保存的文件（在目录设置成功后）
            setTimeout(() => {
              const savedFile = localStorage.getItem('last-selected-file');
              if (savedFile) {
                setSelectedFile(savedFile);
                console.log('📄 恢复最后选中的文件:', savedFile);
              }
            }, 500);
          } else {
            console.warn('⚠️ 无法设置保存的目录，使用默认目录');
            localStorage.removeItem('last-selected-directory');
          }
        } else {
          // 没有保存的目录，仍然尝试恢复文件
          const savedFile = localStorage.getItem('last-selected-file');
          if (savedFile) {
            setSelectedFile(savedFile);
            console.log('📄 恢复最后选中的文件:', savedFile);
          }
        }
      } catch (error) {
        console.error('❌ 恢复用户状态失败:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    restoreUserState();
  }, []);

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    // 保存最后选中的文件
    localStorage.setItem('last-selected-file', filePath);
    console.log('💾 保存最后选中的文件:', filePath);
  };

  // 处理目录更改
  const handleDirectoryChange = (newPath: string) => {
    // 保存新目录到localStorage
    localStorage.setItem('last-selected-directory', newPath);
    setCurrentDirectory(newPath);
    
    // 刷新文件树
    setRefreshKey(prev => prev + 1);
    
    // 清空当前选中的文件（因为目录变了，之前的文件可能不存在了）
    setSelectedFile('');
    localStorage.removeItem('last-selected-file');
    
    console.log('📁 目录已更改并保存:', newPath);
  };

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
    </div>
  );
} 