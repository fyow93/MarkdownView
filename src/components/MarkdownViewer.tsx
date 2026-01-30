'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List } from 'lucide-react';
import { 
  LeftSideToc,  
  BackToTopButton,
} from '@/components/markdown';
import MarkdownHeader from '@/components/markdown/MarkdownHeader';
import MarkdownContent from '@/components/markdown/MarkdownContent';
import { 
  ErrorState,
  EmptyState 
} from '@/components/markdown/StateComponents';
import { logger } from '@/lib/logger';
import { useMarkdownLoader } from '@/hooks/useMarkdownLoader';
import { useScrollPosition } from '@/hooks/useScrollPosition';

import { Skeleton } from '@/components/ui/skeleton';

interface MarkdownViewerProps {
  filePath?: string;
  onFileSelect?: (filePath: string) => void;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ filePath }) => {
  const [showToc, setShowToc] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('Markdown');

  // Load markdown content and manage state
  const {
    content,
    toc,
    loading,
    error,
    lastUpdateTime,
    isConnected,
    isRealTimeEnabled,
    setIsRealTimeEnabled,
    loadContent,
    activeHeadingId,
    setActiveHeadingId
  } = useMarkdownLoader({ filePath });

  // Manage scroll position
  const { 
    showBackToTop, 
    scrollToTop, 
    scrollToHeading, 
    clearScrollPosition,
    handleScroll
  } = useScrollPosition({
    filePath,
    scrollAreaRef,
    content,
    loading,
    setActiveHeadingId
  });

  // Initialize mermaid
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: 16,
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
        sequence: { useMaxWidth: true, messageFontSize: 14, actorFontSize: 16 },
        gitGraph: { useMaxWidth: true }
      });
    } catch (err) {
      logger.error('Mermaid initialization failed:', err);
    }
  }, []);

  // Handle scroll events
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Empty state
  if (!filePath) {
    return (
      <div className="h-full flex relative">
        <LeftSideToc 
          toc={toc} 
          activeId={activeHeadingId}
          onItemClick={scrollToHeading}
          isVisible={showToc}
        />
        <div className={`flex-1 transition-all duration-200 ease-in-out ${showToc ? 'pl-2' : 'pl-0'}`}>
          <EmptyState />
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex relative p-4">
        {/* Skeleton Sidebar - mimicking LeftSideToc */}
        {showToc && (
          <div className="w-80 shrink-0 pr-4 hidden lg:block">
            <div className="h-full border rounded-lg bg-linear-to-br from-background to-muted/30 border-primary/20">
              <div className="p-4 border-b bg-linear-to-r from-primary/5 to-primary/10 flex items-center gap-2">
                 <Skeleton className="h-4 w-4 rounded-sm" />
                 <Skeleton className="h-4 w-32" />
                 <Skeleton className="h-4 w-8 rounded-full ml-auto" />
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <Skeleton className="h-3 w-3 rounded-full" />
                     <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="flex items-center gap-2">
                     <Skeleton className="h-3 w-3 rounded-full" />
                     <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex items-center gap-2">
                     <Skeleton className="h-3 w-3 rounded-full" />
                     <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
                <div className="pl-4 space-y-3">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <Skeleton className="h-3 w-3 rounded-full" />
                     <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex items-center gap-2">
                     <Skeleton className="h-3 w-3 rounded-full" />
                     <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="pl-4 space-y-3">
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Skeleton Main Content */}
        <div className={`flex-1 transition-all duration-200 ease-in-out ${showToc ? 'pl-2' : 'pl-0'}`}>
          <Card className="h-full bg-linear-to-br from-background to-muted/20">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Skeleton className="h-8 w-8 rounded-md" />
                   <div className="space-y-1">
                     <Skeleton className="h-5 w-48" />
                     <Skeleton className="h-3 w-32" />
                   </div>
                </div>
                <div className="flex gap-2">
                   <Skeleton className="h-8 w-8 rounded-md" />
                   <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Heading Skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>

              {/* Paragraph Skeletons */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-full" />
              </div>

              {/* Block/Code Skeleton */}
              <Skeleton className="h-40 w-full rounded-xl" />

              {/* More Text */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
        <BackToTopButton visible={showBackToTop} onClick={scrollToTop} />
      </div>
    );
  }

  // Error state
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
          <ErrorState 
            error={error} 
            onRetry={loadContent} 
            title={t('loadFailed')}
            retryLabel={t('retry')}
          />
        </div>
        <BackToTopButton visible={showBackToTop} onClick={scrollToTop} />
      </div>
    );
  }

  return (
    <div className="h-full flex relative p-4">
      {/* Left TOC */}
      <LeftSideToc 
        toc={toc} 
        activeId={activeHeadingId}
        onItemClick={scrollToHeading}
        isVisible={showToc}
      />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-200 ease-in-out animate-fade-in ${showToc ? 'pl-2' : 'pl-0'}`}>
        <Card className="h-full bg-linear-to-br from-background to-muted/20">
          <MarkdownHeader 
            filePath={filePath}
            toc={toc}
            showToc={showToc}
            setShowToc={setShowToc}
            lastUpdateTime={lastUpdateTime}
            isRealTimeEnabled={isRealTimeEnabled}
            setIsRealTimeEnabled={setIsRealTimeEnabled}
            isConnected={isConnected}
            onClearScroll={clearScrollPosition}
            onRefresh={loadContent}
          />
          <CardContent className="p-0">
            <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-14rem)]">
              <div className="p-8">
                <MarkdownContent 
                  content={content} 
                  onHeadingClick={scrollToHeading} 
                />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      
      {/* Mobile Table of Contents Toggle */}
      {toc.length > 0 && !showToc && (
        <div className="fixed bottom-20 right-8 z-50 lg:hidden">
          <Button
            size="icon"
            className="rounded-full shadow-lg h-12 w-12"
            onClick={() => setShowToc(true)}
          >
            <List className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Back to Top Button */}
      <BackToTopButton visible={showBackToTop} onClick={scrollToTop} />
    </div>
  );
};

export default MarkdownViewer;
