'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';
import { buildFileApiUrl } from '@/lib/utils';
import { getMarkdownCacheEntry, setMarkdownCacheEntry } from '@/lib/markdown-cache';

/**
 * TOC Item interface for table of contents
 */
export interface TocItem {
  id: string;
  text: string;
  level: number;
  children?: TocItem[];
  isCollapsed?: boolean;
}

/**
 * Options for useMarkdownLoader hook
 */
export interface UseMarkdownLoaderOptions {
  filePath?: string;
  pollInterval?: number;
}

/**
 * Result interface for useMarkdownLoader hook
 */
export interface UseMarkdownLoaderResult {
  content: string;
  toc: TocItem[];
  loading: boolean;
  error: string | null;
  lastModified: string | null;
  lastUpdateTime: string | null;
  isConnected: boolean;
  isRealTimeEnabled: boolean;
  setIsRealTimeEnabled: (enabled: boolean) => void;
  loadContent: () => Promise<void>;
  activeHeadingId: string;
  setActiveHeadingId: (id: string) => void;
}

// Configuration constants
const DEFAULT_POLL_INTERVAL = 3000;

/**
 * Generate heading ID from text (consistent with HeadingComponent)
 */
const generateHeadingId = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate table of contents from markdown content
 */
const generateToc = (markdown: string): TocItem[] => {
  const flatHeadings: TocItem[] = [];
  
  // Parse code block positions to avoid matching # in code blocks
  const codeBlockRanges: Array<{ start: number; end: number }> = [];
  
  // Match fenced code blocks (``` or ~~~)
  const fencedCodeRegex = /^```[\s\S]*?^```|^~~~[\s\S]*?^~~~/gm;
  let codeMatch;
  while ((codeMatch = fencedCodeRegex.exec(markdown)) !== null) {
    codeBlockRanges.push({
      start: codeMatch.index,
      end: codeMatch.index + codeMatch[0].length
    });
  }
  
  // Match indented code blocks
  const indentedCodeRegex = /^(?: {4}|\t).*$/gm;
  while ((codeMatch = indentedCodeRegex.exec(markdown)) !== null) {
    codeBlockRanges.push({
      start: codeMatch.index,
      end: codeMatch.index + codeMatch[0].length
    });
  }
  
  // Sort code block ranges by start position
  codeBlockRanges.sort((a, b) => a.start - b.start);
  
  // Check if a position is inside a code block
  const isInCodeBlock = (position: number): boolean => {
    return codeBlockRanges.some(range => position >= range.start && position <= range.end);
  };
  
  // Find headings, excluding those inside code blocks
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    if (isInCodeBlock(match.index)) {
      continue;
    }
    
    const level = match[1].length;
    const text = match[2].trim();
    
    if (text) {
      const id = generateHeadingId(text);
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

  // Build hierarchy
  const buildHierarchy = (headings: TocItem[]): TocItem[] => {
    const result: TocItem[] = [];
    const stack: TocItem[] = [];

    for (const heading of headings) {
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        result.push(heading);
      } else {
        const parent = stack[stack.length - 1];
        if (!parent.children) parent.children = [];
        parent.children.push(heading);
      }

      stack.push(heading);
    }

    return result;
  };

  return buildHierarchy(flatHeadings);
};

/**
 * Hook for loading and managing markdown content with caching and real-time updates
 */
export function useMarkdownLoader(
  options: UseMarkdownLoaderOptions = {}
): UseMarkdownLoaderResult {
  const { filePath, pollInterval = DEFAULT_POLL_INTERVAL } = options;
  
  const [content, setContent] = useState<string>('');
  const [toc, setToc] = useState<TocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  const loadContentAbortRef = useRef<AbortController | null>(null);
  
  const locale = useLocale();
  const t = useTranslations('Markdown');

  const loadContent = useCallback(async () => {
    if (!filePath) {
      loadContentAbortRef.current?.abort();
      loadContentAbortRef.current = null;
      setContent('');
      setError(null);
      setToc([]);
      return;
    }

    loadContentAbortRef.current?.abort();
    const controller = new AbortController();
    loadContentAbortRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      
      // Check cache
      const cacheKey = `${locale}:${filePath}`;
      const cached = getMarkdownCacheEntry<TocItem[]>(cacheKey);
      
      const response = await fetch(buildFileApiUrl(filePath), {
        signal: controller.signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // If cache exists and file not modified, use cache
      if (loadContentAbortRef.current !== controller) {
        return;
      }

      if (cached && cached.lastModified === data.lastModified) {
        setContent(cached.content);
        setToc(cached.toc);
        setLastModified(data.lastModified);
        setLastUpdateTime(new Date().toLocaleString());
        return;
      }
      
      // Generate new content and TOC
      const newToc = generateToc(data.content);
      
      // Update cache (LRU strategy)
      setMarkdownCacheEntry(cacheKey, {
        content: data.content,
        toc: newToc,
        lastModified: data.lastModified
      });
      
      setContent(data.content);
      setToc(newToc);
      setLastModified(data.lastModified);
      setLastUpdateTime(new Date().toLocaleString());
      
    } catch (err) {
      if (controller.signal.aborted || loadContentAbortRef.current !== controller) {
        return;
      }
      logger.error('Failed to load content:', err);
      setError(err instanceof Error ? err.message : t('error'));
      setContent('');
      setToc([]);
    } finally {
      if (loadContentAbortRef.current === controller) {
        setLoading(false);
        loadContentAbortRef.current = null;
      }
    }
  }, [filePath, locale, t]);

  useEffect(() => {
    return () => {
      loadContentAbortRef.current?.abort();
      loadContentAbortRef.current = null;
    };
  }, []);

  // Load content when filePath changes
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Real-time file change detection via polling
  useEffect(() => {
    if (!isRealTimeEnabled || !filePath) {
      setIsConnected(false);
      return;
    }

    setIsConnected(true);

    const controller = new AbortController();

    const checkFileChanges = async () => {
      try {
        const response = await fetch(buildFileApiUrl(filePath), {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          if (controller.signal.aborted) {
            return;
          }
          if (lastModified && data.lastModified !== lastModified) {
            setContent(data.content);
            setLastModified(data.lastModified);
            setLastUpdateTime(new Date().toLocaleString());
            
            // Regenerate TOC and update cache
            const newToc = generateToc(data.content);
            setToc(newToc);
            
            const cacheKey = `${locale}:${filePath}`;
            setMarkdownCacheEntry(cacheKey, {
              content: data.content,
              toc: newToc,
              lastModified: data.lastModified
            });
          } else if (!lastModified) {
            setLastModified(data.lastModified);
          }
        }
      } catch {
        // Silently handle file change detection error
      }
    };

    const interval = setInterval(checkFileChanges, pollInterval);

    return () => {
      controller.abort();
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [filePath, isRealTimeEnabled, lastModified, pollInterval, locale]);

  return {
    content,
    toc,
    loading,
    error,
    lastModified,
    lastUpdateTime,
    isConnected,
    isRealTimeEnabled,
    setIsRealTimeEnabled,
    loadContent,
    activeHeadingId,
    setActiveHeadingId,
  };
}

export default useMarkdownLoader;
