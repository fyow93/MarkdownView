'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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
  ChevronDown,
  Hash,
  ArrowUp
} from 'lucide-react';

interface MarkdownViewerProps {
  filePath?: string;
  onFileSelect?: (filePath: string) => void;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
  children?: TocItem[];
  isCollapsed?: boolean;
}



// 延迟渲染的Mermaid图表组件
const LazyMermaidChart: React.FC<{ chart: string }> = ({ chart }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // 使用Intersection Observer检测组件是否可见
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // 添加小延迟避免频繁触发
          setTimeout(() => setShouldRender(true), 100);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // 提前200px开始加载
        threshold: 0.1
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 占位符组件
  if (!shouldRender) {
    return (
      <div ref={elementRef}>
        <Card className="my-6 bg-muted/10 border-dashed border-2 border-muted">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
              <span className="text-sm text-muted-foreground">
                {isVisible ? '正在加载图表...' : '图表准备中'}
              </span>
              <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="mt-4 flex justify-center">
              <div className="bg-muted/50 px-3 py-1 rounded text-xs text-muted-foreground">
                Mermaid Chart
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <MermaidChart chart={chart} />;
};

// 实际的Mermaid图表渲染组件
const MermaidChart: React.FC<{ chart: string }> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    const renderChart = async () => {
      try {
        setIsLoading(true);
        setError('');
        setSvg('');
        
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const result = await mermaid.render(id, chart);
        
        if (isMounted) {
          setSvg(result.svg);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Mermaid渲染错误:', err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(`Chart rendering failed: ${errorMessage}`);
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
            Mermaid Chart Rendering Failed
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
            <span className="text-sm text-muted-foreground">Rendering chart...</span>
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

// 左侧目录组件 - 支持折叠功能
const LeftSideToc: React.FC<{ 
  toc: TocItem[], 
  activeId: string,
  onItemClick: (id: string) => void,
  isVisible: boolean
}> = React.memo(({ toc, activeId, onItemClick, isVisible }) => {
  const t = useTranslations('Navigation');
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(() => {
    // 从 localStorage 恢复折叠状态
    try {
      const saved = localStorage.getItem('toc-collapsed-items');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const countTotalItems = useCallback((items: TocItem[]): number => {
    return items.reduce((count, item) => {
      return count + 1 + (item.children ? countTotalItems(item.children) : 0);
    }, 0);
  }, []);

  const totalItems = useMemo(() => countTotalItems(toc), [toc, countTotalItems]);

  const getAllItemIds = useCallback((items: TocItem[]): string[] => {
    const ids: string[] = [];
    const traverse = (items: TocItem[]) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          ids.push(item.id);
          traverse(item.children);
        }
      });
    };
    traverse(items);
    return ids;
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedItems(new Set());
    try {
      localStorage.setItem('toc-collapsed-items', JSON.stringify([]));
    } catch (error) {
      console.warn('Failed to save TOC collapse state:', error);
    }
  }, []);

  const collapseAll = useCallback(() => {
    const allIds = getAllItemIds(toc);
    setCollapsedItems(new Set(allIds));
    try {
      localStorage.setItem('toc-collapsed-items', JSON.stringify(allIds));
    } catch (error) {
      console.warn('Failed to save TOC collapse state:', error);
    }
  }, [getAllItemIds, toc]);

  const handleItemClick = useCallback((id: string) => {
    // 找到目标标题的路径并展开
    const expandToItem = (targetId: string, items: TocItem[], path: string[] = []): boolean => {
      for (const item of items) {
        const currentPath = [...path, item.id];
        
        if (item.id === targetId) {
          // 找到目标，展开路径上的所有父级
          setCollapsedItems(prev => {
            const newSet = new Set(prev);
            path.forEach(id => newSet.delete(id));
            return newSet;
          });
          return true;
        }
        
        if (item.children && item.children.length > 0) {
          if (expandToItem(targetId, item.children, currentPath)) {
            return true;
          }
        }
      }
      return false;
    };

    expandToItem(id, toc);
    onItemClick(id);
  }, [toc, onItemClick]);

  const getFontSizeClass = (level: number) => {
    switch (level) {
      case 1: return 'text-base font-semibold';
      case 2: return 'text-sm font-medium';
      case 3: return 'text-sm';
      case 4: return 'text-xs font-medium';
      case 5: return 'text-xs';
      case 6: return 'text-xs';
      default: return 'text-sm';
    }
  };

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      // 保存到 localStorage
      try {
        localStorage.setItem('toc-collapsed-items', JSON.stringify(Array.from(newSet)));
      } catch (error) {
        console.warn('Failed to save TOC collapse state:', error);
      }
      return newSet;
    });
  };

  // 如果没有目录内容且不可见，不渲染
  if (toc.length === 0 && !isVisible) return null;

  const renderTocItem = (item: TocItem, depth: number = 0): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0;
    const isCollapsed = collapsedItems.has(item.id);
    const isActive = activeId === item.id;

    return (
      <div key={item.id} className="space-y-1">
        <div
          className={`
            w-full text-left p-2.5 rounded-lg transition-all duration-200
            flex items-center gap-2 group hover:bg-primary/10
            ${isActive 
              ? 'bg-primary/15 text-primary border-l-4 border-primary shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
            }
            ${getFontSizeClass(item.level)}
          `}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => toggleCollapse(item.id, e)}
              className={`
                flex-shrink-0 p-1 rounded-sm hover:bg-primary/20 transition-all duration-200
                ${isCollapsed ? 'rotate-0' : 'rotate-90'}
              `}
              title={isCollapsed ? 'Expand subdirectory' : 'Collapse subdirectory'}
            >
              <ChevronRight className="h-3 w-3 transition-transform duration-200" />
            </button>
          ) : (
            <div className="w-5 flex justify-center">
              <Hash className="h-3 w-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
            </div>
          )}
          
          <button
            onClick={() => handleItemClick(item.id)}
            className="flex-1 text-left truncate hover:text-foreground transition-colors"
            title={`跳转到: ${item.text}`}
          >
            {item.text}
          </button>
          
          {hasChildren && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
              {item.children!.length}
            </Badge>
          )}
          
          {isActive && (
            <ChevronRight className="h-3 w-3 text-primary flex-shrink-0" />
          )}
        </div>
        
        {hasChildren && (
          <div 
            className={`
              transition-all duration-300 ease-in-out overflow-hidden
              ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}
            `}
          >
            <div className="space-y-1 pt-1">
              {item.children!.map(child => renderTocItem(child, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`
        flex-shrink-0 h-full pr-2 transition-all duration-200 ease-in-out overflow-hidden
        ${isVisible ? 'w-80 opacity-100' : 'w-0 opacity-0'}
      `}
    >
      <Card className="h-full bg-gradient-to-br from-background to-muted/30 border-primary/20 w-80">
        <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <List className="h-4 w-4 text-primary" />
              {t('tableOfContents')}
              <Badge variant="secondary" className="text-xs">
                {totalItems}
              </Badge>
            </CardTitle>
            
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="p-4 space-y-1">
              {toc.map(item => renderTocItem(item))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
});



// 全局缓存 - 限制最大缓存数量防止内存泄漏
const MAX_CACHE_SIZE = 50;
const contentCache = new Map<string, { content: string; toc: TocItem[]; lastModified: string }>();

// 缓存管理函数
const manageCacheSize = () => {
  if (contentCache.size > MAX_CACHE_SIZE) {
    const firstKey = contentCache.keys().next().value;
    if (firstKey) {
      contentCache.delete(firstKey);
    }
  }
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ filePath, onFileSelect }) => {
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
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const t = useTranslations('Markdown');
  const tNav = useTranslations('Navigation');

  // 改进的目录生成函数，正确处理HTML标签
  // 统一的ID生成函数，确保目录和标题元素使用相同的ID生成逻辑
  const generateId = useCallback((text: string): string => {
    // 第一步：清理HTML标签，但保留标签内的文本内容
    let cleanText = text.replace(/<[^>]*>/g, '');
    
    // 第二步：清理markdown格式符号
    cleanText = cleanText.replace(/[*_`~]/g, '');
    
    // 第三步：规范化空白字符
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // 第四步：生成URL友好的ID
    const id = cleanText
      .toLowerCase()
      // 保留中文字符、英文字符、数字和连字符
      .replace(/[^\w\s\u4e00-\u9fff\-\.]/g, '')
      // 将空格替换为连字符
      .replace(/\s+/g, '-')
      // 移除多余的连字符
      .replace(/-+/g, '-')
      // 移除开头和结尾的连字符
      .replace(/^-+|-+$/g, '');
    

    
    return id;
  }, []);

  const generateToc = useCallback((markdown: string): TocItem[] => {
    const flatHeadings: TocItem[] = [];
    
    // 首先解析出所有代码块的位置，避免将代码块中的 # 识别为标题
    const codeBlockRanges: Array<{ start: number; end: number }> = [];
    
    // 匹配围栏代码块 (``` 或 ~~~)
    const fencedCodeRegex = /^```[\s\S]*?^```|^~~~[\s\S]*?^~~~/gm;
    let codeMatch;
    while ((codeMatch = fencedCodeRegex.exec(markdown)) !== null) {
      codeBlockRanges.push({
        start: codeMatch.index,
        end: codeMatch.index + codeMatch[0].length
      });
    }
    
    // 匹配缩进代码块（连续的4空格或tab缩进行）
    const indentedCodeRegex = /^(?: {4}|\t).*$/gm;
    while ((codeMatch = indentedCodeRegex.exec(markdown)) !== null) {
      codeBlockRanges.push({
        start: codeMatch.index,
        end: codeMatch.index + codeMatch[0].length
      });
    }
    
    // 按开始位置排序代码块范围
    codeBlockRanges.sort((a, b) => a.start - b.start);
    
    // 检查给定位置是否在代码块内
    const isInCodeBlock = (position: number): boolean => {
      return codeBlockRanges.some(range => position >= range.start && position <= range.end);
    };
    
    // 查找标题，但跳过代码块内的内容
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    // 首先生成扁平的标题列表，排除代码块中的标题
    while ((match = headingRegex.exec(markdown)) !== null) {
      // 检查这个匹配是否在代码块内
      if (isInCodeBlock(match.index)) {
        continue;
      }
      
      const level = match[1].length;
      let text = match[2].trim();
      
      if (text) {
        // 使用统一的ID生成函数
        const id = generateId(text);
        // 清理显示文本
        const displayText = text.replace(/<[^>]*>/g, '').replace(/[*_`~]/g, '').replace(/\s+/g, ' ').trim();
        
        flatHeadings.push({ 
          id, 
          text: displayText, 
          level,
          children: [],
          isCollapsed: false
        });
      }
    }

    // 构建层级结构
    const buildHierarchy = (headings: TocItem[]): TocItem[] => {
      const result: TocItem[] = [];
      const stack: TocItem[] = [];

      for (const heading of headings) {
        // 找到合适的父级
        while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
          stack.pop();
        }

        if (stack.length === 0) {
          // 顶级标题
          result.push(heading);
        } else {
          // 子级标题
          const parent = stack[stack.length - 1];
          if (!parent.children) parent.children = [];
          parent.children.push(heading);
        }

        stack.push(heading);
      }

      return result;
    };

    const finalToc = buildHierarchy(flatHeadings);
    return finalToc;
  }, [generateId]);

  // 回到顶部功能
  const scrollToTop = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        const startScrollTop = scrollElement.scrollTop;
        const duration = 500; // 500ms动画时间
        const startTime = performance.now();
        
        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // 使用easeOutCubic缓动函数
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          const currentScrollTop = startScrollTop * (1 - easeOutCubic);
          
          scrollElement.scrollTo({
            top: currentScrollTop,
            behavior: 'auto'
          });
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };
        
        requestAnimationFrame(animateScroll);
        setActiveHeadingId(''); // 清除活动标题
      }
    }
  };

  // 滚动到指定标题
  const scrollToHeading = (id: string) => {
    let element = document.getElementById(id);
    
    // 如果未找到元素，尝试在所有标题中查找
    if (!element) {
      const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const foundById = Array.from(allHeadings).find(h => h.id === id);
      if (foundById) {
        element = foundById as HTMLElement;
      }
    }
    
    if (element && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        const containerRect = scrollElement.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + scrollElement.scrollTop;
        
        // 统一的偏移量，与scroll-mt-24 (96px)保持一致
        const offset = 100; // 与scroll-mt-24略微一致的偏移量
        
        const targetScrollTop = Math.max(0, relativeTop - offset);
        
        // 使用自定义动画实现平滑滚动
        const startScrollTop = scrollElement.scrollTop;
        const distance = targetScrollTop - startScrollTop;
        const duration = 300; // 300ms动画时间
        const startTime = performance.now();
        
        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // 使用easeOutCubic缓动函数
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          const currentScrollTop = startScrollTop + distance * easeOutCubic;
          
          scrollElement.scrollTo({
            top: currentScrollTop,
            behavior: 'auto'
          });
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };
        
        requestAnimationFrame(animateScroll);
        setActiveHeadingId(id);
      }
    }
  };

  // 保存滚动位置
  const saveScrollPosition = React.useCallback(() => {
    if (!filePath || !scrollAreaRef.current) return;
    
    const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      const scrollTop = scrollElement.scrollTop;
      const scrollKey = `scroll-${filePath}`;
      localStorage.setItem(scrollKey, scrollTop.toString());
    }
  }, [filePath]);

  // 恢复滚动位置
  const restoreScrollPosition = React.useCallback(() => {
    if (!filePath || !scrollAreaRef.current) return;
    
    const scrollKey = `scroll-${filePath}`;
    const savedPosition = localStorage.getItem(scrollKey);
    
    if (savedPosition) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        const targetPosition = parseInt(savedPosition, 10);
        
        // 等待内容完全渲染后再滚动
        setTimeout(() => {
          scrollElement.scrollTo({
            top: targetPosition,
            behavior: 'auto'
          });
        }, 200);
      }
    }
  }, [filePath]);

  const loadContent = React.useCallback(async () => {
    if (!filePath) {
      setContent('');
      setError(null);
      setToc([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 检查缓存
      const cacheKey = `${locale}:${filePath}`;
      const cached = contentCache.get(cacheKey);
      
      const response = await fetch(`/${locale}/api/file/${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // 如果缓存存在且文件未修改，使用缓存
      if (cached && cached.lastModified === data.lastModified) {
        setContent(cached.content);
        setToc(cached.toc);
        setLastModified(data.lastModified);
        setLastUpdateTime(new Date().toLocaleString());
        return;
      }
      
      // 生成新内容和目录
      const newToc = generateToc(data.content);
      
      // 更新缓存
      manageCacheSize();
      contentCache.set(cacheKey, {
        content: data.content,
        toc: newToc,
        lastModified: data.lastModified
      });
      
      setContent(data.content);
      setToc(newToc);
      setLastModified(data.lastModified);
      setLastUpdateTime(new Date().toLocaleString());
      
    } catch (err) {
      console.error('Failed to load content:', err);
      setError(err instanceof Error ? err.message : t('error'));
      setContent('');
      setToc([]);
    } finally {
      setLoading(false);
    }
  }, [filePath, locale, generateToc, t]);

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
        gitGraph: {
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

    const checkFileChanges = async () => {
      try {
        const response = await fetch(`/${locale}/api/file/${encodeURIComponent(filePath)}`);
        if (response.ok) {
          const data = await response.json();
          if (lastModified && data.lastModified !== lastModified) {
            saveScrollPosition();
            setContent(data.content);
            setLastModified(data.lastModified);
            setLastUpdateTime(new Date().toLocaleString());
            
            // 重新生成目录并更新缓存
            const newToc = generateToc(data.content);
            setToc(newToc);
            
            // 更新缓存
            const cacheKey = `${locale}:${filePath}`;
            manageCacheSize();
            contentCache.set(cacheKey, {
              content: data.content,
              toc: newToc,
              lastModified: data.lastModified
            });
          } else if (!lastModified) {
            setLastModified(data.lastModified);
          }
        }
      } catch (error) {
        console.error('文件变更检测错误:', error);
      }
    };

    checkFileChanges();
    const interval = setInterval(checkFileChanges, 3000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [filePath, isRealTimeEnabled, lastModified, saveScrollPosition, locale]);

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
      
      // 检查滚动位置，决定是否显示"回到顶部"按钮
      const scrollTop = scrollElement.scrollTop;
      const shouldShow = scrollTop > 300;
      setShowBackToTop(shouldShow);
      

    };

    scrollElement.addEventListener('scroll', handleScroll);
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [filePath, saveScrollPosition]);

  const clearCurrentScrollPosition = () => {
    if (!filePath) return;
    
    const scrollKey = `scroll-${filePath}`;
    localStorage.removeItem(scrollKey);
  };

  // 清理所有滚动位置记录
  const clearAllScrollPositions = () => {
    const keys = Object.keys(localStorage);
    const scrollKeys = keys.filter(key => key.startsWith('scroll-'));
    scrollKeys.forEach(key => localStorage.removeItem(key));
  };

  // 获取所有已保存阅读位置的文件
  const getSavedScrollPositions = () => {
    const keys = Object.keys(localStorage);
    const scrollKeys = keys.filter(key => key.startsWith('scroll-'));
    return scrollKeys.map(key => ({
      filePath: key.replace('scroll-', ''),
      position: parseInt(localStorage.getItem(key) || '0', 10)
    }));
  };



  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // 组件卸载时保存当前阅读位置
  useEffect(() => {
    return () => {
      // 确保在组件卸载时保存当前阅读位置
      saveScrollPosition();
    };
  }, [saveScrollPosition]);

  // 页面关闭/刷新时保存阅读位置
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveScrollPosition]);

  // 内容加载完成后恢复滚动位置
  useEffect(() => {
    if (content && !loading) {
      restoreScrollPosition();
    }
  }, [content, loading, restoreScrollPosition]);

  // 提取React元素中的纯文本内容
  const extractTextFromReactNode = (node: React.ReactNode): string => {
    if (typeof node === 'string') {
      return node;
    }
    if (typeof node === 'number') {
      return String(node);
    }
    if (Array.isArray(node)) {
      return node.map(extractTextFromReactNode).join('');
    }
    if (node && typeof node === 'object' && 'props' in node) {
      // 如果是React元素，递归提取其children的文本
      return extractTextFromReactNode((node as any).props?.children);
    }
    return '';
  };

  // 自定义标题组件，添加id属性
  const HeadingComponent = ({ level, children, ...props }: { level: number; children?: React.ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => {
    // 正确提取文本内容，处理React元素
    const text = extractTextFromReactNode(children);
    // 使用统一的ID生成函数，确保与目录中的ID一致
    const id = generateId(text);

    const className = `
      scroll-mt-24 font-semibold tracking-tight group
      ${level === 1 ? 'text-3xl lg:text-4xl mb-6 text-primary border-b pb-3' : ''}
      ${level === 2 ? 'text-2xl lg:text-3xl mt-8 mb-4 text-primary/90' : ''}
      ${level === 3 ? 'text-xl lg:text-2xl mt-6 mb-3 text-primary/80' : ''}
      ${level === 4 ? 'text-lg lg:text-xl mt-4 mb-2 text-primary/70' : ''}
      ${level === 5 ? 'text-base lg:text-lg mt-3 mb-2 text-primary/60' : ''}
      ${level === 6 ? 'text-sm lg:text-base mt-2 mb-2 text-primary/50' : ''}
    `;

    const content = (
      <span className="flex items-center gap-2">
        {children}
        <Hash className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity cursor-pointer" 
              onClick={() => scrollToHeading(id)} />
      </span>
    );
    
    switch (level) {
      case 1:
        return <h1 id={id} className={className} {...props}>{content}</h1>;
      case 2:
        return <h2 id={id} className={className} {...props}>{content}</h2>;
      case 3:
        return <h3 id={id} className={className} {...props}>{content}</h3>;
      case 4:
        return <h4 id={id} className={className} {...props}>{content}</h4>;
      case 5:
        return <h5 id={id} className={className} {...props}>{content}</h5>;
      case 6:
        return <h6 id={id} className={className} {...props}>{content}</h6>;
      default:
        return <h2 id={id} className={className} {...props}>{content}</h2>;
    }
  };

  // 代码块组件
  const CodeBlock = ({ className, children, ...props }: React.ComponentProps<'code'> & { className?: string }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    if (language === 'mermaid') {
      return <LazyMermaidChart chart={String(children).replace(/\n$/, '')} />;
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={tomorrow as any}
            language={language}
            PreTag="div"
            className="!m-0 !rounded-none"
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

  // 处理文件选择
  const handleFileSelect = useCallback((selectedFilePath: string) => {
    if (onFileSelect) {
      onFileSelect(selectedFilePath);
    }
  }, [onFileSelect]);

  // 预加载相关文件（可选优化）
  const preloadFile = useCallback(async (filePath: string) => {
    const cacheKey = `${locale}:${filePath}`;
    if (!contentCache.has(cacheKey)) {
      try {
        const response = await fetch(`/${locale}/api/file/${encodeURIComponent(filePath)}`);
        if (response.ok) {
          const data = await response.json();
          const newToc = generateToc(data.content);
          manageCacheSize();
          contentCache.set(cacheKey, {
            content: data.content,
            toc: newToc,
            lastModified: data.lastModified
          });
        }
      } catch (error) {
        // 预加载失败不影响主要功能
        console.debug('Preload failed:', error);
      }
    }
  }, [locale, generateToc]);

  if (!filePath) {
    return (
      <div className="h-full flex relative">
        {/* 左侧目录 */}
        <LeftSideToc 
          toc={toc} 
          activeId={activeHeadingId}
          onItemClick={scrollToHeading}
          isVisible={showToc}
        />
        
        {/* 主内容区域 */}
        <div className={`flex-1 transition-all duration-200 ease-in-out ${showToc ? 'pl-2' : 'pl-0'}`}>
          <Card className="h-full bg-gradient-to-br from-background to-muted/30">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="text-xl font-semibold mb-2 text-primary">Markdown Viewer</div>
                  <div className="text-sm text-muted-foreground">请从顶部导航栏选择一个Markdown文件来查看</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex relative p-4">
        <LeftSideToc 
          toc={toc} 
          activeId={activeHeadingId}
          onItemClick={scrollToHeading}
          isVisible={showToc}
        />
        
                  <div className={`flex-1 transition-all duration-200 ease-in-out ${showToc ? 'pl-2' : 'pl-0'}`}>
            <Card className="h-full bg-gradient-to-br from-background to-muted/30">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                </div>
                <div>
                  <div className="text-lg font-medium mb-2">{t('loadingFile')}</div>
                  <div className="text-sm text-muted-foreground">{filePath}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 回到顶部按钮 */}
        <Button
          onClick={scrollToTop}
          className={`
            fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full shadow-lg
            bg-primary hover:bg-primary/90 text-primary-foreground
            transition-all duration-300 ease-in-out
            hover:scale-110 hover:shadow-xl
            ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-0'}
          `}
          style={{ 
            display: showBackToTop || process.env.NODE_ENV === 'development' ? 'flex' : 'none' 
          }}
          size="icon"
          title={t('backToTop')}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex relative p-4">
        <LeftSideToc 
          toc={toc} 
          activeId={activeHeadingId}
          onItemClick={scrollToHeading}
          isVisible={showToc}
        />
        
                  <div className={`flex-1 transition-all duration-200 ease-in-out ${showToc ? 'pl-2' : 'pl-0'}`}>
            <Card className="h-full border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <div className="text-lg font-medium mb-2 text-destructive">{t('loadFailed')}</div>
                  <div className="text-sm text-muted-foreground mb-4">{error}</div>
                  <Button onClick={loadContent} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    {t('retry')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 回到顶部按钮 */}
        <Button
          onClick={scrollToTop}
          className={`
            fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full shadow-lg
            bg-primary hover:bg-primary/90 text-primary-foreground
            transition-all duration-300 ease-in-out
            hover:scale-110 hover:shadow-xl
            ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-0'}
          `}
          style={{ 
            display: showBackToTop || process.env.NODE_ENV === 'development' ? 'flex' : 'none' 
          }}
          size="icon"
          title={t('backToTop')}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex relative p-4">
      {/* 左侧目录 */}
      <LeftSideToc 
        toc={toc} 
        activeId={activeHeadingId}
        onItemClick={scrollToHeading}
        isVisible={showToc}
      />
      
      {/* 主内容区域 */}
      <div className={`flex-1 transition-all duration-200 ease-in-out ${showToc ? 'pl-2' : 'pl-0'}`}>
        <Card className="h-full bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {toc.length > 0 && (
                  <Button
                    onClick={() => setShowToc(!showToc)}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <List className="h-4 w-4" />
                    {showToc ? tNav('hideToc') : tNav('showToc')}
                  </Button>
                )}
                <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg truncate">{filePath ? filePath.split('/').pop() : ''}</CardTitle>
                  {lastUpdateTime && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{t('updatedAt')} {lastUpdateTime}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                  variant="ghost"
                  size="sm"
                  className={`${isRealTimeEnabled && isConnected ? 'text-green-600' : 'text-muted-foreground'}`}
                  title={isRealTimeEnabled ? (isConnected ? t('realtimeEnabled') : t('realtimeConnecting')) : t('realtimeDisabled')}
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
                  title={t('clearScrollPosition')}
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
            <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-14rem)]">
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
                        <div className="my-6 not-prose">
                          <Card className="overflow-hidden border-border/50 shadow-sm">
                            <CardContent className="p-0">
                              <div className="overflow-x-auto">
                                <table className="custom-table w-full border-collapse border-0" {...props}>
                                  {children}
                                </table>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ),
                      th: ({ children, ...props }) => (
                        <th className="custom-th border-r border-b border-border bg-muted/80 px-4 py-3 text-left font-semibold text-foreground first:border-l-0 last:border-r-0" {...props}>
                          {children}
                        </th>
                      ),
                      td: ({ children, ...props }) => (
                        <td className="custom-td border-r border-b border-border px-4 py-3 text-foreground first:border-l-0 last:border-r-0" {...props}>
                          {children}
                        </td>
                      ),
                      thead: ({ children, ...props }) => (
                        <thead className="bg-muted/30" {...props}>
                          {children}
                        </thead>
                      ),
                      tbody: ({ children, ...props }) => (
                        <tbody className="divide-y divide-border" {...props}>
                          {children}
                        </tbody>
                      ),
                      tr: ({ children, ...props }) => (
                        <tr className="hover:bg-muted/20 transition-colors" {...props}>
                          {children}
                        </tr>
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
      
      {/* 回到顶部按钮 */}
      <Button
        onClick={scrollToTop}
        className={`
          fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full shadow-lg
          bg-primary hover:bg-primary/90 text-primary-foreground
          transition-all duration-300 ease-in-out
          hover:scale-110 hover:shadow-xl
          ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-0'}
        `}
        style={{ 
          display: showBackToTop || process.env.NODE_ENV === 'development' ? 'flex' : 'none' 
        }}
        size="icon"
        title={t('backToTop')}
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default MarkdownViewer; 