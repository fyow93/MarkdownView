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
  Hash
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
    console.log('🖱️ 目录点击:', id);
    
    // 找到目标标题的路径并展开
    const expandToItem = (targetId: string, items: TocItem[], path: string[] = []): boolean => {
      for (const item of items) {
        const currentPath = [...path, item.id];
        
        if (item.id === targetId) {
          console.log('📍 找到目标标题:', targetId, '路径:', path);
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
    console.log('🔄 调用scrollToHeading:', id);
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
    contentCache.delete(firstKey);
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const t = useTranslations('Markdown');
  const tNav = useTranslations('Navigation');

  // 改进的目录生成函数，正确处理HTML标签
  // 统一的ID生成函数，确保目录和标题元素使用相同的ID生成逻辑
  const generateId = useCallback((text: string): string => {
    // 清理HTML标签和格式符号
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/[*_`~]/g, '').replace(/\s+/g, ' ').trim();
    const id = cleanText
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, '')
      .replace(/\s+/g, '-');
    
    return id;
  }, []);

  const generateToc = useCallback((markdown: string): TocItem[] => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const flatHeadings: TocItem[] = [];
    let match;

    // 首先生成扁平的标题列表
    while ((match = headingRegex.exec(markdown)) !== null) {
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
        console.log(`📚 生成目录项 H${level}:`, id, '显示文本:', displayText);
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

    return buildHierarchy(flatHeadings);
  }, [generateId]);

  // 滚动到指定标题
  const scrollToHeading = (id: string) => {
    console.log('🎯 scrollToHeading被调用:', id);
    const element = document.getElementById(id);
    console.log('🔍 查找DOM元素:', element ? '找到' : '未找到', element);
    
    // 特别针对一级标题的调试
    if (!element) {
      console.log('❌ 未找到元素，尝试其他方法查找...');
      const allH1 = document.querySelectorAll('h1');
      console.log('📋 页面上所有H1标题:', Array.from(allH1).map(h => ({ id: h.id, text: h.textContent })));
      
      // 尝试通过文本内容查找
      const foundByText = Array.from(allH1).find(h => h.id === id);
      if (foundByText) {
        console.log('✅ 通过文本匹配找到H1:', foundByText);
        element = foundByText;
      }
    }
    
    if (element) {
      console.log('🎯 找到目标元素:', element.tagName, element.id, element.textContent);
      console.log('📐 元素位置信息:', {
        offsetTop: element.offsetTop,
        offsetLeft: element.offsetLeft,
        clientHeight: element.clientHeight,
        scrollTop: element.scrollTop,
        boundingRect: element.getBoundingClientRect()
      });
    }
    
    if (element && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        const containerRect = scrollElement.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + scrollElement.scrollTop;
        
        console.log('📊 滚动计算:', {
          containerRect,
          elementRect,
          relativeTop,
          scrollElementTop: scrollElement.scrollTop
        });
        
        // 统一的偏移量，与scroll-mt-24 (96px)保持一致
        const offset = 100; // 与scroll-mt-24略微一致的偏移量
        
        const targetScrollTop = Math.max(0, relativeTop - offset);
        console.log(`🎯 滚动到标题:`, id, '目标位置:', targetScrollTop);
        
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
          } else {
            console.log('✅ 滚动动画完成');
          }
        };
        
        requestAnimationFrame(animateScroll);
        setActiveHeadingId(id);
      } else {
        console.log('❌ 未找到滚动容器');
      }
    } else {
      console.log('❌ 跳转失败:', element ? '找到元素但未找到滚动区域' : '未找到目标元素');
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
      console.log('💾 保存阅读位置:', filePath, '位置:', scrollTop);
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
        console.log('📍 恢复阅读位置:', filePath, '位置:', targetPosition);
        
        // 等待内容完全渲染后再滚动
        setTimeout(() => {
          scrollElement.scrollTo({
            top: targetPosition,
            behavior: 'auto'
          });
          console.log('✅ 阅读位置已恢复');
        }, 200);
      }
    } else {
      console.log('📖 新文件，从顶部开始阅读:', filePath);
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
    console.log('👀 开始监控文件:', filePath);

    const checkFileChanges = async () => {
      try {
        const response = await fetch(`/${locale}/api/file/${encodeURIComponent(filePath)}`);
        if (response.ok) {
          const data = await response.json();
          if (lastModified && data.lastModified !== lastModified) {
            console.log('📝 检测到文件变更:', filePath);
            console.log('🔄 文件已更改，重新加载...');
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
    console.log('🗑️ 清除阅读位置:', filePath);
  };

  // 清理所有滚动位置记录
  const clearAllScrollPositions = () => {
    const keys = Object.keys(localStorage);
    const scrollKeys = keys.filter(key => key.startsWith('scroll-'));
    scrollKeys.forEach(key => localStorage.removeItem(key));
    console.log('🧹 清理所有阅读位置记录:', scrollKeys.length, '个文件');
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

  // 调试函数：检查页面中所有标题的ID
  const debugHeadingIds = () => {
    console.log('🚨=== 标题跳转调试信息 ===🚨');
    
    // 获取页面上所有标题元素
    const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    console.log('📋 页面上的标题元素:');
    Array.from(allHeadings).forEach((heading, index) => {
      console.log(`  ${index + 1}. ${heading.tagName} id="${heading.id}" text="${heading.textContent}"`);
    });

    // 专门检查一级标题
    const h1Elements = document.querySelectorAll('h1');
    console.log('🔍 专门检查H1标题:');
    Array.from(h1Elements).forEach((h1, index) => {
      console.log(`  H1 ${index + 1}:`, {
        id: h1.id,
        text: h1.textContent,
        element: h1,
        offsetTop: h1.offsetTop,
        offsetLeft: h1.offsetLeft,
        scrollTop: h1.scrollTop,
        boundingRect: h1.getBoundingClientRect(),
        className: h1.className,
        style: h1.style.cssText,
        parentElement: h1.parentElement?.tagName
      });
    });

    // 获取TOC中的所有ID
    const getAllTocIds = (items: TocItem[], prefix = '') => {
      const ids: string[] = [];
      items.forEach((item, index) => {
        const currentPrefix = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        console.log(`${currentPrefix}. Level ${item.level}: "${item.text}" -> id: "${item.id}"`);
        ids.push(item.id);
        if (item.children) {
          ids.push(...getAllTocIds(item.children, currentPrefix));
        }
      });
      return ids;
    };

    console.log('📚 目录中的标题ID:');
    const tocIds = getAllTocIds(toc);

    // 专门检查一级标题的目录项
    const h1TocItems = toc.filter(item => item.level === 1);
    console.log('🎯 专门检查H1目录项:');
    h1TocItems.forEach((item, index) => {
      console.log(`  H1目录 ${index + 1}:`, {
        id: item.id,
        text: item.text,
        level: item.level,
        hasChildren: !!item.children,
        childrenCount: item.children?.length || 0
      });
      
      // 检查对应的DOM元素
      const domElement = document.getElementById(item.id);
      console.log(`    对应DOM元素:`, domElement ? '找到' : '未找到', domElement);
      if (domElement) {
        console.log(`    DOM详情:`, {
          tagName: domElement.tagName,
          className: domElement.className,
          textContent: domElement.textContent,
          offsetTop: domElement.offsetTop
        });
      }
    });

    // 比较差异
    console.log('⚖️ 对比页面标题与目录标题:');
    const pageHeadingIds = Array.from(allHeadings).map(h => h.id);
    const missingInPage = tocIds.filter(id => !pageHeadingIds.includes(id));
    const missingInToc = pageHeadingIds.filter(id => id && !tocIds.includes(id));
    
    if (missingInPage.length > 0) {
      console.log('❌ 目录中有但页面中没有的ID:', missingInPage);
    }
    if (missingInToc.length > 0) {
      console.log('❌ 页面中有但目录中没有的ID:', missingInToc);
    }
    if (missingInPage.length === 0 && missingInToc.length === 0) {
      console.log('✅ 目录和页面标题ID完全匹配');
    }

    console.log('🚨=== 调试信息结束 ===🚨');
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

  // 内容加载完成后恢复滚动位置和调试
  useEffect(() => {
    if (content && !loading) {
      restoreScrollPosition();
      // 延迟执行调试，确保DOM完全渲染
      setTimeout(() => {
        debugHeadingIds();
      }, 500);
    }
  }, [content, loading, restoreScrollPosition]);

  // 自定义标题组件，添加id属性
  const HeadingComponent = ({ level, children, ...props }: { level: number; children?: React.ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = children?.toString() || '';
    // 使用统一的ID生成函数，确保与目录中的ID一致
    const id = generateId(text);
    console.log(`🏷️ 生成H${level}标题ID:`, id, '文本:', text);

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
                {process.env.NODE_ENV === 'development' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={debugHeadingIds}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      🐛 调试
                    </Button>
                    <Button
                      onClick={() => {
                        const h1Items = toc.filter(item => item.level === 1);
                        if (h1Items.length > 0) {
                          console.log('🧪 测试第一个H1标题跳转:', h1Items[0].id);
                          scrollToHeading(h1Items[0].id);
                        } else {
                          console.log('❌ 没有找到H1标题');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                    >
                      🧪 测试H1
                    </Button>
                  </div>
                )}
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
    </div>
  );
};

export default MarkdownViewer; 