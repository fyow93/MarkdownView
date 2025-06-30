import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import { io, Socket } from 'socket.io-client';
import './MarkdownViewer.css';
import './markdown-styles.css';

// 确保表头样式的CSS补丁 - 使用最高优先级覆盖
const tableHeaderStyles = `
  .table-wrapper .data-table thead tr th.table-header-blue,
  .data-table thead tr th.table-header-blue,
  .data-table tbody tr th.table-header-blue,
  .table-wrapper th.table-header-blue,
  .data-table th.table-header-blue,
  th.table-header-blue {
    background-color: #1e40af !important;
    background-image: none !important;
    color: white !important;
    font-weight: 600 !important;
    text-align: center !important;
    padding: 12px 8px !important;
    border: 1px solid #1e3a8a !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
    letter-spacing: 0.5px !important;
    position: relative !important;
    z-index: 1 !important;
  }
  
  .table-wrapper .data-table thead tr th.table-header-blue::before,
  .data-table thead tr th.table-header-blue::before,
  .data-table tbody tr th.table-header-blue::before,
  .table-wrapper th.table-header-blue::before,
  .data-table th.table-header-blue::before,
  th.table-header-blue::before {
    content: '' !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%) !important;
    pointer-events: none !important;
    z-index: 2 !important;
  }

  /* 强制覆盖 data-table th 的通用样式 */
  .data-table th.table-header-blue {
    background-color: #1e40af !important;
  }
  
  /* 内联代码样式 */
  .inline-code {
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 2px 6px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    color: #dc2626;
    white-space: nowrap;
  }
  
  /* 深色主题下的内联代码样式 */
  @media (prefers-color-scheme: dark) {
    .inline-code {
      background-color: #374151;
      border-color: #4b5563;
      color: #fbbf24;
    }
  }
`;

interface MarkdownViewerProps {
  filePath?: string;
}

// Mermaid图表组件 - 简化版本修复状态更新问题
const MermaidChart: React.FC<{ chart: string }> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    const renderChart = async () => {
      console.log('🎯 开始渲染Mermaid图表...');
      console.log('📄 图表内容预览:', chart.substring(0, 100) + '...');
      
      try {
        // 重置状态
        setIsLoading(true);
        setError('');
        setSvg('');
        
        // 生成唯一ID
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('🆔 生成的图表ID:', id);
        
        // 渲染mermaid图表
        console.log('⚡ 开始调用mermaid.render...');
        const result = await mermaid.render(id, chart);
        console.log('🎨 Mermaid渲染完成, SVG长度:', result.svg.length);
        
        // 只有在组件仍然挂载时才更新状态
        if (isMounted) {
          console.log('✅ 组件仍挂载，更新SVG状态...');
          setSvg(result.svg);
          setIsLoading(false);
          console.log('🎉 状态更新完成!');
        } else {
          console.log('⚠️ 组件已卸载，跳过状态更新');
        }
      } catch (err) {
        console.error('❌ Mermaid渲染错误:', err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : '未知错误';
          setError(`图表渲染失败: ${errorMessage}`);
          setIsLoading(false);
        }
      }
    };

    // 直接调用，不使用setTimeout
    renderChart();
    
    return () => {
      console.log('🧹 清理MermaidChart组件...');
      isMounted = false;
    };
  }, [chart]);

  // 实时状态调试
  console.log('🔍 MermaidChart当前状态:', { 
    isLoading,
    hasError: !!error, 
    hasSvg: !!svg, 
    svgLength: svg?.length || 0
  });

  if (error) {
    return (
      <div className="mermaid-error">
        <div className="error-header">🚫 Mermaid图表渲染失败</div>
        <div className="error-message">{error}</div>
        <pre className="error-code">{chart}</pre>
      </div>
    );
  }

  if (isLoading || !svg) {
    return (
      <div className="mermaid-loading">
        <div className="loading-spinner"></div>
        <span>正在渲染图表...</span>
      </div>
    );
  }

  console.log('✅ 渲染SVG到DOM, 长度:', svg.length);

  return (
    <div 
      className="mermaid-chart"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ filePath }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  // 初始化mermaid配置 - 简化配置避免兼容性问题
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false, // 改为false，手动控制渲染
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Arial, sans-serif',
        fontSize: 14,
        // 只保留基本的通用配置
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true
        },
        sequence: {
          useMaxWidth: true
        },
        gantt: {
          useMaxWidth: true
        },
        class: {
          useMaxWidth: true
        },
        state: {
          useMaxWidth: true
        },
        er: {
          useMaxWidth: true
        },
        pie: {
          useMaxWidth: true
        },
        journey: {
          useMaxWidth: true
        },
        gitGraph: {
          useMaxWidth: true
        }
             });
       console.log('✅ Mermaid初始化成功');
       
       // 添加简单测试
       setTimeout(async () => {
         try {
           const testChart = 'graph TD\n    A[Test] --> B[Success]';
           const { svg } = await mermaid.render('test-id-123', testChart);
           console.log('🧪 Mermaid测试渲染成功, SVG长度:', svg.length);
           console.log('🎨 测试SVG预览:', svg.substring(0, 200) + '...');
         } catch (testError) {
           console.error('❌ Mermaid测试渲染失败:', testError);
         }
       }, 1000);
       
     } catch (error) {
       console.error('❌ Mermaid初始化失败:', error);
     }
   }, []);

  // WebSocket连接管理
  useEffect(() => {
    console.log('🔌 初始化WebSocket连接...');
    
    // 创建socket连接
    const newSocket = io('http://localhost:3001');
    
    // 连接事件处理
    newSocket.on('connect', () => {
      console.log('✅ WebSocket已连接:', newSocket.id);
      setIsConnected(true);
      setSocket(newSocket);
    });
    
    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket已断开连接');
      setIsConnected(false);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket连接错误:', error);
      setIsConnected(false);
    });
    
    // 清理函数
    return () => {
      console.log('🧹 清理WebSocket连接...');
      newSocket.disconnect();
    };
  }, []);

  // 文件监听管理
  useEffect(() => {
    if (!socket || !filePath || !isConnected || !autoRefreshEnabled) {
      return;
    }
    
    console.log(`👀 开始监听文件变化: ${filePath}`);
    
    // 订阅当前文件的变化
    socket.emit('subscribe-file', filePath);
    
    // 监听文件变化事件
    const handleFileChanged = (data: any) => {
      console.log('📁 收到文件变化通知:', data);
      if (data.filePath === filePath) {
        setLastUpdateTime(new Date().toLocaleString());
        // 延迟一点点再刷新，确保文件写入完成
        setTimeout(() => {
          console.log('🔄 自动刷新文件内容...');
          loadContent();
        }, 100);
      }
    };
    
    socket.on('file-changed', handleFileChanged);
    
    // 清理函数
    return () => {
      console.log(`🛑 停止监听文件变化: ${filePath}`);
      socket.emit('unsubscribe-file', filePath);
      socket.off('file-changed', handleFileChanged);
    };
  }, [socket, filePath, isConnected, autoRefreshEnabled]);

  // 加载文件内容函数
  const loadContent = async () => {
    if (!filePath) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3001/api/file/${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('文件未找到');
        } else if (response.status === 403) {
          throw new Error('访问被拒绝');
        } else {
          throw new Error(`HTTP错误: ${response.status}`);
        }
      }
      
      const data = await response.json();
      setContent(data.content);
      setLastModified(data.lastModified ? new Date(data.lastModified).toLocaleString() : null);
      console.log('✅ 文件内容加载完成');
    } catch (err) {
      console.error('Failed to load file content:', err);
      const errorMessage = err instanceof Error ? err.message : '加载文件失败';
      setError(errorMessage);
      
      // 提供错误页面内容
      setContent(`# ❌ 加载失败

无法加载文件 \`${filePath}\`

**错误信息**: ${errorMessage}

## 可能的原因

1. **服务器未启动** - 请确保后端服务器正在运行
2. **文件不存在** - 请检查文件路径是否正确
3. **网络连接问题** - 请检查网络连接

## 解决方法

1. 确保服务器运行在 http://localhost:3001
2. 检查文件是否存在于项目目录中
3. 刷新页面重试

---

*技术支持: 如果问题持续存在，请检查浏览器控制台了解详细错误信息。*`);
    } finally {
      setLoading(false);
    }
  };

     // 文件加载效果
    useEffect(() => {
    if (!filePath) {
      setContent(`# 欢迎使用 Markdown 查看器 🔄

🎉 **Projects Wiki Viewer** 是一个基于 [react-markdown](https://remarkjs.github.io/react-markdown/) 构建的文档查看器，现已支持**实时动态刷新**功能！

## 🆕 新功能特性

- 🔄 **实时动态刷新** - 编辑文档时页面自动更新，无需手动刷新
- 🔌 **WebSocket连接** - 实时监控文件变化
- ⚡ **毫秒级响应** - 文件保存后立即反映变化

## 功能特性

- 📁 **文件树导航** - 浏览项目目录结构
- 📝 **Markdown 渲染** - 完整支持 Markdown 语法
- 🎨 **代码高亮** - 支持多种编程语言语法高亮
- 📊 **Mermaid 图表** - 支持流程图、序列图、甘特图等多种图表
- 📱 **响应式设计** - 适配桌面和移动设备
- ⚡ **实时加载** - 快速加载文件内容

## 使用方法

1. 从左侧文件树中选择一个 Markdown 文件
2. 文件内容将在此处显示
3. **编辑文档时页面会自动刷新** - 无需手动操作！
4. 支持表格、代码块、任务列表等 Markdown 功能

## 技术栈

| 类型 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | React | 19.x | 用户界面库 |
| 类型系统 | TypeScript | 4.9+ | 静态类型检查 |
| Markdown | react-markdown | 10.x | Markdown 渲染引擎 |
| GFM 支持 | remark-gfm | 4.x | GitHub 风格 Markdown |
| 代码高亮 | react-syntax-highlighter | 15.x | 语法高亮显示 |
| 图表渲染 | mermaid | 11.x | 流程图、序列图等图表 |
| 后端 | Node.js + Express | 18.x | API服务器 |
| **实时更新** | **Socket.IO** | **4.x** | **WebSocket通信** |
| **文件监控** | **Chokidar** | **4.x** | **文件系统监控** |

## 测试表格功能

下面是一个功能测试表格：

| 功能 | 状态 | 优先级 | 进度 |
|------|------|--------|------|
| 📁 文件树导航 | ✅ **完成** | 🔴 高 | 100% |
| 📝 Markdown渲染 | ✅ **完成** | 🔴 高 | 100% |
| 🎨 代码高亮 | ✅ **完成** | 🟡 中 | 100% |
| 📊 表格渲染 | ✅ **完成** | 🟡 中 | 100% |
| 📈 Mermaid图表 | ✅ **完成** | 🟡 中 | 100% |
| 📱 响应式设计 | ✅ **完成** | 🟡 中 | 100% |
| **🔄 实时刷新** | **✅ 新功能** | **🔴 高** | **100%** |
| 🔍 搜索功能 | ⏳ 待开发 | 🟢 低 | 0% |
| 🌙 主题切换 | ⏳ 待开发 | 🟢 低 | 0% |

---

*请从左侧文件树中选择一个 Markdown 文件开始阅读。现在支持实时动态刷新功能！*`);
      setLastModified(null);
      setError(null);
      return;
    }

    // 初次加载文件内容
    loadContent();
  }, [filePath]);

  // 处理代码块 (```代码块```)
  const CodeBlock = ({ className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    // 检查是否是mermaid图表
    if (language === 'mermaid') {
      return <MermaidChart chart={String(children).replace(/\n$/, '')} />;
    }
    
    return (
      <SyntaxHighlighter
        style={tomorrow}
        language={language}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  };

  // 处理内联代码 (`内联代码`)
  const InlineCode = ({ children, ...props }: any) => {
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    );
  };

  if (loading) {
    return (
      <div className="markdown-viewer">
        {filePath && (
          <div className="markdown-header">
            <div className="file-path">{filePath}</div>
          </div>
        )}
        <div className="markdown-content">
          <div className="loading-placeholder">
            <div className="loading-spinner"></div>
            <p>正在加载文件内容...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="markdown-viewer">
      <style dangerouslySetInnerHTML={{ __html: tableHeaderStyles }} />
      {filePath && (
        <div className="markdown-header">
          <div className="file-path">{filePath}</div>
          <div className="header-controls">
            {/* WebSocket连接状态 */}
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-icon">{isConnected ? '🔌' : '⚡'}</span>
              <span className="status-text">
                {isConnected ? '实时监控中' : '连接中...'}
              </span>
            </div>
            
            {/* 自动刷新开关 */}
            <div className="auto-refresh-toggle">
              <label>
                <input 
                  type="checkbox" 
                  checked={autoRefreshEnabled}
                  onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                />
                <span>自动刷新</span>
              </label>
            </div>
            
            {/* 最后更新时间 */}
            {lastUpdateTime && (
              <div className="last-update">
                <span className="update-icon">🔄</span>
                <span>最后更新: {lastUpdateTime}</span>
              </div>
            )}
          </div>
          
          {lastModified && (
            <div className="file-meta">
              <span className="last-modified">文件修改: {lastModified}</span>
            </div>
          )}
          {error && (
            <div className="error-badge">
              ⚠️ 加载失败
            </div>
          )}
        </div>
      )}
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            pre: ({ children, ...props }) => {
              // 代码块会被包装在 <pre><code> 中
              // 我们需要提取 code 元素的内容来处理
              const codeElement = React.Children.toArray(children)[0] as React.ReactElement;
              if (codeElement && codeElement.props) {
                return <CodeBlock {...codeElement.props} />;
              }
              return <pre {...props}>{children}</pre>;
            },
            code: ({ inline, ...props }: any) => {
              // 如果是内联代码，使用 InlineCode 组件
              if (inline) {
                return <InlineCode {...props} />;
              }
              // 块级代码会通过 pre 组件处理，这里不应该到达
              return <code {...props} />;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownViewer; 