'use client';

import React, { useState, useEffect } from 'react';
import MarkdownViewer from '@/components/MarkdownViewer';

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
          </div>
          <div className="text-sm text-muted-foreground hidden sm:block">
            使用{' '}
            <a
              href="https://remarkjs.github.io/react-markdown/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              react-markdown
            </a>{' '}
            构建
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
