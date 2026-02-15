'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { List, ChevronRight, Hash } from 'lucide-react';

/** Storage key for persisted collapsed state */
const STORAGE_KEY = 'toc-collapsed-items';

export interface TocItem {
  id: string;
  text: string;
  level: number;
  children?: TocItem[];
  isCollapsed?: boolean;
}

interface LeftSideTocProps {
  toc: TocItem[];
  activeId: string;
  onItemClick: (id: string) => void;
  isVisible: boolean;
}

/**
 * Left side table of contents component with collapsible sections
 */
const LeftSideToc: React.FC<LeftSideTocProps> = React.memo(({ toc, activeId, onItemClick, isVisible }) => {
  const t = useTranslations('Navigation');
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());

  // Load collapsed state from localStorage after hydration (SSR-safe)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCollapsedItems(new Set(JSON.parse(saved)));
      }
    } catch {
      // Ignore localStorage errors (private browsing, etc.)
    }
  }, []);

  const countTotalItems = useCallback((items: TocItem[]): number => {
    return items.reduce((count, item) => {
      return count + 1 + (item.children ? countTotalItems(item.children) : 0);
    }, 0);
  }, []);

  const totalItems = useMemo(() => countTotalItems(toc), [toc, countTotalItems]);

  const handleItemClick = useCallback((id: string) => {
    const expandToItem = (targetId: string, items: TocItem[], path: string[] = []): boolean => {
      for (const item of items) {
        const currentPath = [...path, item.id];
        
        if (item.id === targetId) {
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
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newSet)));
      } catch {
        // Silently handle save failure
      }
      return newSet;
    });
  };

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
                shrink-0 p-1 rounded-sm hover:bg-primary/20 transition-all duration-200
                ${isCollapsed ? 'rotate-0' : 'rotate-90'}
              `}
              title={isCollapsed ? 'Expand subdirectory' : 'Collapse subdirectory'}
            >
              <ChevronRight className="h-3 w-3 transition-transform duration-200" />
            </button>
          ) : (
            <div className="w-5 flex justify-center">
              <Hash className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100" />
            </div>
          )}
          
          <button
            onClick={() => handleItemClick(item.id)}
            className="flex-1 text-left truncate hover:text-foreground transition-colors"
            title={`Jump to: ${item.text}`}
          >
            {item.text}
          </button>
          
          {hasChildren && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
              {item.children!.length}
            </Badge>
          )}
          
          {isActive && (
            <ChevronRight className="h-3 w-3 text-primary shrink-0" />
          )}
        </div>
        
        {hasChildren && (
          <div 
            className={`
              grid transition-all duration-300 ease-in-out
              ${isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}
            `}
          >
            <div className="overflow-hidden space-y-1 pt-1">
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
        shrink-0 h-full pr-2 transition-all duration-200 ease-in-out overflow-hidden
        ${isVisible ? 'w-80 opacity-100' : 'w-0 opacity-0'}
      `}
    >
      <Card className="h-full bg-linear-to-br from-background to-muted/30 border-primary/20 w-80">
        <CardHeader className="pb-3 border-b bg-linear-to-r from-primary/5 to-primary/10">
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

LeftSideToc.displayName = 'LeftSideToc';

export default LeftSideToc;
