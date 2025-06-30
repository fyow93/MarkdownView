'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  Clock, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  MapPin, 
  List,
  FileText,
  ChevronRight,
  Hash
} from 'lucide-react';

interface MarkdownViewerProps {
  filePath?: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
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
      <Card className="my-6 border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-destructive text-base">
            <AlertCircle className="h-4 w-4" />
            Mermaid图表渲染失败
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="bg-muted/50 p-3 rounded-md">
            <pre className="text-xs overflow-x-auto">
              <code>{chart}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !svg) {
    return (
      <Card className="my-6 bg-muted/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
            <span className="text-sm text-muted-foreground">正在渲染图表...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-6 bg-gradient-to-br from-background to-muted/20 border-primary/20">
      <CardContent className="p-6">
        <div 
          className="mermaid-chart flex justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </CardContent>
    </Card>
  );
};

// 目录组件
const TableOfContents: React.FC<{ 
  toc: TocItem[], 
  activeId: string,
  onItemClick: (id: string) => void 
}> = ({ toc, activeId, onItemClick }) => {
  if (toc.length === 0) return null;

  return (
    <Card className="sticky top-4 bg-gradient-to-br from-background to-muted/30 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <List className="h-4 w-4 text-primary" />
          目录
          <Badge variant="secondary" className="text-xs">
            {toc.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {toc.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`
              w-full text-left p-2 rounded-md text-sm transition-all duration-200
              flex items-center gap-2 group hover:bg-primary/10
              ${activeId === item.id 
                ? 'bg-primary/15 text-primary border-l-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
            style={{ paddingLeft: `${item.level * 12 + 8}px` }}
          >
            <Hash className="h-3 w-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
            <span className="truncate">{item.text}</span>
            {activeId === item.id && (
              <ChevronRight className="h-3 w-3 ml-auto text-primary" />
            )}
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ filePath }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [showToc, setShowToc] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 生成目录
  const generateToc = (markdown: string): TocItem[] => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s\u4e00-\u9fff]/g, '')
        .replace(/\s+/g, '-');
      
      headings.push({ id, text, level });
    }

    return headings;
  };

  // 滚动到指定标题
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        const elementTop = element.offsetTop;
        const offset = 100; // 顶部偏移量
        scrollElement.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth'
        });
        setActiveHeadingId(id);
      }
    }
  };

  // 初始化mermaid配置
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: 16,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        },
        sequence: {
          useMaxWidth: true,
          messageFontSize: 14,
          actorFontSize: 16
        },
        gitgraph: {
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
            saveScrollPosition();
            setContent(data.content);
            setLastModified(data.lastModified);
            setLastUpdateTime(new Date().toLocaleString());
            
            // 重新生成目录
            const newToc = generateToc(data.content);
            setToc(newToc);
          } else if (!lastModified) {
            setLastModified(data.lastModified);
          }
        }
      } catch (error) {
        console.error('❌ 文件变更检测错误:', error);
      }
    };

    checkFileChanges();
    const interval = setInterval(checkFileChanges, 3000);

    return () => {
      console.log('🔇 停止监控文件:', filePath);
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [filePath, isRealTimeEnabled, lastModified]);

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
    const savedPosition = localStorage.getItem(scrollKey);
    
    if (savedPosition) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: 'auto'
          });
          console.log('📍 恢复滚动位置:', filePath, savedPosition);
        }, 100);
      }
    }
  };

  // 滚动事件处理（防抖）
  useEffect(() => {
    if (!filePath || !scrollAreaRef.current) return;

    const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;

    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveScrollPosition();
      }, 500);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [filePath]);

  const clearCurrentScrollPosition = () => {
    if (!filePath) return;
    
    const scrollKey = `scroll-${filePath}`;
    localStorage.removeItem(scrollKey);
    console.log('🗑️ 清除滚动位置:', filePath);
  };

  const loadContent = async () => {
    if (!filePath) {
      setContent('');
      setError(null);
      setToc([]);
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
      
      // 生成目录
      const newToc = generateToc(data.content);
      setToc(newToc);
      
    } catch (err) {
      console.error('Failed to load content:', err);
      setError(err instanceof Error ? err.message : '加载文件失败');
      setContent('');
      setToc([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [filePath]);

  // 内容加载完成后恢复滚动位置
  useEffect(() => {
    if (content && !loading) {
      restoreScrollPosition();
    }
  }, [content, loading]);

  // 自定义标题组件，添加id属性
  const HeadingComponent = ({ level, children, ...props }: any) => {
    const text = children?.toString() || '';
    const id = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, '')
      .replace(/\s+/g, '-');

    const Tag = `h${level}` as keyof JSX.IntrinsicElements;
    
    return (
      <Tag
        id={id}
        className={`
          scroll-m-20 font-semibold tracking-tight group
          ${level === 1 ? 'text-3xl lg:text-4xl mb-6 text-primary border-b pb-3' : ''}
          ${level === 2 ? 'text-2xl lg:text-3xl mt-8 mb-4 text-primary/90' : ''}
          ${level === 3 ? 'text-xl lg:text-2xl mt-6 mb-3 text-primary/80' : ''}
          ${level === 4 ? 'text-lg lg:text-xl mt-4 mb-2 text-primary/70' : ''}
          ${level === 5 ? 'text-base lg:text-lg mt-3 mb-2 text-primary/60' : ''}
          ${level === 6 ? 'text-sm lg:text-base mt-2 mb-2 text-primary/50' : ''}
        `}
        {...props}
      >
        <span className="flex items-center gap-2">
          {children}
          <Hash className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity cursor-pointer" 
                onClick={() => scrollToHeading(id)} />
        </span>
      </Tag>
    );
  };

  // 代码块组件
  const CodeBlock = ({ className, children, ...props }: React.ComponentProps<'code'> & { className?: string }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    if (language === 'mermaid') {
      return <MermaidChart chart={String(children).replace(/\n$/, '')} />;
    }
    
    return match ? (
      <Card className="my-4 overflow-hidden border-muted">
        <CardHeader className="pb-2 bg-muted/50">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs font-mono">
              {language}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <SyntaxHighlighter
            style={tomorrow}
            language={language}
            PreTag="div"
            className="!m-0 !rounded-none"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </CardContent>
      </Card>
    ) : (
      <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    );
  };

  if (!filePath) {
    return (
      <Card className="h-full bg-gradient-to-br from-background to-muted/30">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="text-xl font-semibold mb-2 text-primary">Markdown Viewer</div>
              <div className="text-sm text-muted-foreground">请从左侧选择一个Markdown文件来查看</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full bg-gradient-to-br from-background to-muted/30">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
            <div>
              <div className="text-lg font-medium mb-2">正在加载文件...</div>
              <div className="text-sm text-muted-foreground">{filePath}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <div className="text-lg font-medium mb-2 text-destructive">加载失败</div>
              <div className="text-sm text-muted-foreground mb-4">{error}</div>
              <Button onClick={loadContent} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                重试
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex gap-4">
      {/* 主内容区域 */}
      <div className={`${showToc && toc.length > 0 ? 'flex-1' : 'w-full'}`}>
        <Card className="h-full bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg truncate">{filePath}</CardTitle>
                  {lastUpdateTime && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>更新于 {lastUpdateTime}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {toc.length > 0 && (
                  <Button
                    onClick={() => setShowToc(!showToc)}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <List className="h-4 w-4" />
                    {showToc ? '隐藏目录' : '显示目录'}
                  </Button>
                )}
                <Separator orientation="vertical" className="h-6" />
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
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-12rem)]">
              <div ref={contentRef} className="p-8">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      code: CodeBlock,
                      h1: (props) => <HeadingComponent level={1} {...props} />,
                      h2: (props) => <HeadingComponent level={2} {...props} />,
                      h3: (props) => <HeadingComponent level={3} {...props} />,
                      h4: (props) => <HeadingComponent level={4} {...props} />,
                      h5: (props) => <HeadingComponent level={5} {...props} />,
                      h6: (props) => <HeadingComponent level={6} {...props} />,
                      blockquote: ({ children, ...props }) => (
                        <blockquote className="border-l-4 border-primary/30 bg-primary/5 pl-4 py-2 my-4 italic" {...props}>
                          {children}
                        </blockquote>
                      ),
                      table: ({ children, ...props }) => (
                        <Card className="my-6">
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse" {...props}>
                                {children}
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      ),
                      th: ({ children, ...props }) => (
                        <th className="border border-muted bg-muted/50 px-4 py-2 text-left font-semibold" {...props}>
                          {children}
                        </th>
                      ),
                      td: ({ children, ...props }) => (
                        <td className="border border-muted px-4 py-2" {...props}>
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* 目录侧边栏 */}
      {showToc && toc.length > 0 && (
        <div className="w-80 flex-shrink-0">
          <TableOfContents 
            toc={toc} 
            activeId={activeHeadingId}
            onItemClick={scrollToHeading}
          />
        </div>
      )}
    </div>
  );
};

export default MarkdownViewer; 