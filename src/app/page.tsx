'use client';

import React, { useState, useEffect } from 'react';
import FileTree from '@/components/FileTree';
import MarkdownViewer from '@/components/MarkdownViewer';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    
    // 在移动设备上选择文件后关闭菜单
    if (window.innerWidth <= 768) {
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
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
      <div className="flex-1 relative">
        {/* Desktop Layout */}
        <div className="hidden md:block h-full">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <div className="h-full p-4">
                <FileTree
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
              <div className="h-full p-4">
                <MarkdownViewer filePath={selectedFile} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden h-full">
          {/* Mobile Sidebar */}
          <div
            className={`
              absolute inset-y-0 left-0 z-50 w-80 bg-background border-r transform transition-transform duration-300 ease-in-out
              ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            <div className="h-full p-4">
              <FileTree
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
              />
            </div>
          </div>

          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div
              className="absolute inset-0 bg-black/50 z-40"
              onClick={toggleMobileMenu}
            />
          )}

          {/* Mobile Main Content */}
          <div className="h-full p-4">
            <MarkdownViewer filePath={selectedFile} />
          </div>
        </div>
      </div>
    </div>
  );
}
