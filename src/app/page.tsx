'use client';

import React, { useState, useEffect } from 'react';
import MarkdownViewer from '@/components/MarkdownViewer';
import { DropdownFileTree } from '@/components/DropdownFileTree';
import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string>('');

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
            <h1 className="text-xl font-semibold">Markdown Viewer</h1>
            {/* 项目文档下拉菜单 */}
            <DropdownFileTree
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2"
          >
            <a
              href="https://github.com/fyow93/MarkdownView"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </Button>
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
