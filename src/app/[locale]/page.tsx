'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import MarkdownViewer from '@/components/MarkdownViewer';
import { DropdownFileTree } from '@/components/DropdownFileTree';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import GitHubStar from '@/components/GitHubStar';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const t = useTranslations('Navigation');

  // 从localStorage恢复最后选中的文件
  useEffect(() => {
    const savedFile = localStorage.getItem('last-selected-file');
    if (savedFile) {
      setSelectedFile(savedFile);
      console.log('📍 恢复最后选中的文件:', savedFile);
    }
  }, []);

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    // 保存最后选中的文件
    localStorage.setItem('last-selected-file', filePath);
    console.log('💾 保存最后选中的文件:', filePath);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{t('title')}</h1>
            {/* 项目文档下拉菜单 */}
            <DropdownFileTree
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <GitHubStar repoUrl="https://github.com/fyow93/MarkdownView" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        <MarkdownViewer 
          filePath={selectedFile}
          onFileSelect={handleFileSelect}
        />
      </div>
    </div>
  );
} 