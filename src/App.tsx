import React, { useState } from 'react';
import FileTree from './components/FileTree';
import MarkdownViewer from './components/MarkdownViewer';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    // 在移动设备上选择文件后关闭菜单
    if (window.innerWidth <= 768) {
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <button className="mobile-menu-button" onClick={toggleMobileMenu}>
            ☰
          </button>
          <h1 className="app-title">Projects Wiki Viewer</h1>
          <div className="header-info">
            使用 <a href="https://remarkjs.github.io/react-markdown/" target="_blank" rel="noopener noreferrer">react-markdown</a> 构建
          </div>
        </div>
      </header>
      
      <div className="app-body">
        <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <FileTree 
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
        </div>
        
        <div className="main-content">
          <MarkdownViewer filePath={selectedFile} />
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={toggleMobileMenu}></div>
      )}
    </div>
  );
}

export default App;
