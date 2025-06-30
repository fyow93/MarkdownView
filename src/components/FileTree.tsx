import React, { useState, useEffect } from 'react';
import './FileTree.css';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  isExpanded?: boolean;
}

interface FileTreeProps {
  onFileSelect: (filePath: string) => void;
  selectedFile?: string;
}

const FileTree: React.FC<FileTreeProps> = ({ onFileSelect, selectedFile }) => {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileTree = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:3001/api/filetree');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setTree(data);
      } catch (err) {
        console.error('Failed to fetch file tree:', err);
        setError(err instanceof Error ? err.message : '获取文件树失败');
        
        // 如果API失败，使用备用的模拟数据
        const fallbackTree: FileNode[] = [
          {
            name: 'projects',
            path: 'projects',
            type: 'directory',
            isExpanded: true,
            children: [
              {
                name: 'InstaForge',
                path: 'projects/InstaForge',
                type: 'directory',
                isExpanded: false,
                children: [
                  {
                    name: 'README.md',
                    path: 'projects/InstaForge/README.md',
                    type: 'file'
                  }
                ]
              }
            ]
          }
        ];
        setTree(fallbackTree);
      } finally {
        setLoading(false);
      }
    };

    fetchFileTree();
  }, []);

  const toggleDirectory = (path: string) => {
    const updateTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === path && node.type === 'directory') {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    
    setTree(updateTree(tree));
  };

  const renderTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map(node => (
      <div key={node.path} className="file-tree-node">
        <div 
          className={`file-tree-item ${node.type} ${selectedFile === node.path ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 20 + 10}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleDirectory(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
        >
          {node.type === 'directory' && (
            <span className={`expand-icon ${node.isExpanded ? 'expanded' : ''}`}>
              ▶
            </span>
          )}
          {node.type === 'file' && (
            <span className="file-icon">📄</span>
          )}
          <span className="file-name">{node.name}</span>
        </div>
        {node.type === 'directory' && node.isExpanded && node.children && (
          <div className="file-tree-children">
            {renderTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="file-tree">
        <div className="file-tree-header">
          <h3>项目文档</h3>
        </div>
        <div className="file-tree-loading">
          <div className="loading-spinner"></div>
          <p>正在加载文件树...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <h3>项目文档</h3>
        {error && (
          <div className="error-indicator" title={`API连接失败: ${error}`}>
            ⚠️ 离线模式
          </div>
        )}
      </div>
      <div className="file-tree-content">
        {tree.length > 0 ? renderTree(tree) : (
          <div className="no-files-message">
            没有找到Markdown文件
          </div>
        )}
      </div>
    </div>
  );
};

export default FileTree; 