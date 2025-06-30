'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, AlertCircle, Wifi, WifiOff, MapPin } from 'lucide-react';

interface MarkdownViewerProps {
  filePath?: string;
}

// Mermaid图表组件
const MermaidChart: React.FC<{ chart: string }> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    const renderChart = async () => {
      console.log('🎯 开始渲染Mermaid图表...');
      
      try {
        setIsLoading(true);
        setError('');
        setSvg('');
        
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('🆔 生成的图表ID:', id);
        
        const result = await mermaid.render(id, chart);
        console.log('🎨 Mermaid渲染完成');
        
        if (isMounted) {
          setSvg(result.svg);
          setIsLoading(false);
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

    renderChart();
    
    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <Card className="my-4 border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Mermaid图表渲染失败</span>
          </div>
          <div className="text-sm text-muted-foreground mb-2">{error}</div>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            <code>{chart}</code>
          </pre>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !svg) {
    return (
      <Card className="my-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">正在渲染图表...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-4">
      <CardContent className="p-4">
        <div 
          className="mermaid-chart flex justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </CardContent>
    </Card>
  );
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ filePath }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [lastModified, setLastModified] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 初始化mermaid配置
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Arial, sans-serif',
        fontSize: 14,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true
        },
        sequence: {
          useMaxWidth: true
        }
      });
    } catch (err) {
      console.error('Mermaid初始化失败:', err);
    }
  }, []);

  // 轮询文件变更检测
  useEffect(() => {
    if (!isRealTimeEnabled || !filePath) {
      setIsConnected(false);
      return;
    }

    setIsConnected(true);
    console.log('👀 开始监控文件:', filePath);

    const checkFileChanges = async () => {
      try {
        const response = await fetch(`/api/file/${encodeURIComponent(filePath)}`);
        if (response.ok) {
          const data = await response.json();
          if (lastModified && data.lastModified !== lastModified) {
            console.log('📝 检测到文件变更:', filePath);
            console.log('🔄 文件已更改，重新加载...');
            // 在重新加载前保存当前滚动位置
            saveScrollPosition();
            setContent(data.content);
            setLastModified(data.lastModified);
            setLastUpdateTime(new Date().toLocaleString());
          } else if (!lastModified) {
            setLastModified(data.lastModified);
          }
        }
      } catch (error) {
        console.error('❌ 文件变更检测错误:', error);
      }
    };

    // 立即检查一次
    checkFileChanges();

    // 每3秒检查一次文件变更
    const interval = setInterval(checkFileChanges, 3000);

    return () => {
      console.log('🔇 停止监控文件:', filePath);
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [filePath, isRealTimeEnabled, lastModified]); // eslint-disable-line react-hooks/exhaustive-deps

  // 保存滚动位置
  const saveScrollPosition = () => {
    if (!filePath || !scrollAreaRef.current) return;
    
    const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      const scrollTop = scrollElement.scrollTop;
      const scrollKey = `scroll-${filePath}`;
      localStorage.setItem(scrollKey, scrollTop.toString());
      console.log('💾 保存滚动位置:', filePath, scrollTop);
    }
  };

  // 恢复滚动位置
  const restoreScrollPosition = () => {
    if (!filePath || !scrollAreaRef.current) return;
    
    const scrollKey = `scroll-${filePath}`;
    const savedScrollTop = localStorage.getItem(scrollKey);
    
    if (savedScrollTop) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        // 延迟恢复滚动位置，确保内容已渲染
        setTimeout(() => {
          scrollElement.scrollTop = parseInt(savedScrollTop, 10);
          console.log('📍 恢复滚动位置:', filePath, savedScrollTop);
        }, 100);
      }
    }
  };

  // 监听滚动事件，实时保存位置
  useEffect(() => {
    if (!scrollAreaRef.current || !filePath) return;
    
    const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;

    let saveTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      // 防抖保存，避免频繁写入localStorage
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveScrollPosition, 500);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      clearTimeout(saveTimeout);
    };
  }, [filePath]); // eslint-disable-line react-hooks/exhaustive-deps

  // 内容加载完成后恢复滚动位置
  useEffect(() => {
    if (content && filePath && !loading) {
      // 等待DOM更新完成后恢复位置
      setTimeout(restoreScrollPosition, 200);
    }
  }, [content, filePath, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // 清除当前文件的保存位置
  const clearCurrentScrollPosition = () => {
    if (!filePath) return;
    
    const scrollKey = `scroll-${filePath}`;
    localStorage.removeItem(scrollKey);
    console.log('🗑️ 清除滚动位置:', filePath);
  };

  // 清除所有文件的保存位置
  const clearAllScrollPositions = () => {
    const keys = Object.keys(localStorage);
    const scrollKeys = keys.filter(key => key.startsWith('scroll-'));
    
    scrollKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('🗑️ 清除所有滚动位置:', scrollKeys.length, '个文件');
  };

  const loadContent = async () => {
    if (!filePath) {
      setContent('');
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/file/${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setContent(data.content);
      setLastModified(data.lastModified);
      setLastUpdateTime(new Date().toLocaleString());
      
    } catch (err) {
      console.error('Failed to load content:', err);
      setError(err instanceof Error ? err.message : '加载文件失败');
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [filePath]); // eslint-disable-line react-hooks/exhaustive-deps

  // 代码块组件
  const CodeBlock = ({ className, children, ...props }: React.ComponentProps<'code'> & { className?: string }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    // 检查是否是Mermaid图表
    if (language === 'mermaid') {
      return <MermaidChart chart={String(children).replace(/\n$/, '')} />;
    }
    
    return match ? (
      <SyntaxHighlighter
        // @ts-expect-error - SyntaxHighlighter style type issue
        style={tomorrow}
        language={language}
        PreTag="div"
        className="rounded-md"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
        {children}
      </code>
    );
  };

  // 内联代码组件
  // const InlineCode = ({ children, ...props }: React.ComponentProps<'code'>) => {
  //   return (
  //     <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
  //       {children}
  //     </code>
  //   );
  // };

  if (!filePath) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <div className="text-lg mb-2">Projects Wiki Viewer</div>
            <div className="text-sm">请从左侧选择一个Markdown文件来查看</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>正在加载文件...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <div className="text-lg font-medium mb-2">加载失败</div>
            <div className="text-sm text-muted-foreground mb-4">{error}</div>
            <Button onClick={loadContent} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="p-0">
        <div className="border-b p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium truncate">{filePath}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {lastUpdateTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>更新于 {lastUpdateTime}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                  variant="ghost"
                  size="sm"
                  className={`${isRealTimeEnabled && isConnected ? 'text-green-600' : 'text-muted-foreground'}`}
                  title={isRealTimeEnabled ? (isConnected ? '实时监控已启用' : '连接中...') : '实时监控已禁用'}
                >
                  {isRealTimeEnabled && isConnected ? (
                    <Wifi className="h-4 w-4" />
                  ) : (
                    <WifiOff className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  onClick={clearCurrentScrollPosition} 
                  variant="ghost" 
                  size="sm"
                  title="清除当前文件的滚动位置"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
                <Button onClick={loadContent} variant="ghost" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-12rem)]">
          <div ref={contentRef} className="p-6">
            <div className="prose">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code: CodeBlock,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MarkdownViewer; 