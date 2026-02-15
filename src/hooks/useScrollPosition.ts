'use client';

import { useState, useCallback, RefObject, useRef, useEffect } from 'react';

/**
 * Options for useScrollPosition hook
 */
export interface UseScrollPositionOptions {
  filePath?: string;
  scrollAreaRef?: RefObject<HTMLElement | null>;
  containerRef?: RefObject<HTMLElement | null>; // Add backward compatibility
  threshold?: number;
  content?: string;
  loading?: boolean;
  setActiveHeadingId?: (id: string) => void;
}

/**
 * Result interface for useScrollPosition hook
 */
export interface UseScrollPositionResult {
  scrollProgress: number;
  showBackToTop: boolean;
  scrollToTop: () => void;
  scrollToHeading: (id: string) => void;
  saveScrollPosition: () => void;
  restoreScrollPosition: () => void;
  clearScrollPosition: () => void;
  handleScroll: () => void;
}

/**
 * Hook for tracking scroll position and providing scroll utilities
 */
export function useScrollPosition(
  options: UseScrollPositionOptions = {}
): UseScrollPositionResult {
  // Support both scrollAreaRef and containerRef for backward compatibility
  const { 
    filePath, 
    scrollAreaRef, 
    containerRef, 
    threshold = 200, 
    setActiveHeadingId 
  } = options;
  
  // Use scrollAreaRef if available, otherwise fallback to containerRef
  const activeRef = scrollAreaRef || containerRef;

  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get scroll element from Radix UI ScrollArea or standard container
  const getScrollElement = useCallback(() => {
    if (!activeRef?.current) return null;
    
    // Check if it's a Radix UI ScrollArea
    const viewport = activeRef.current.querySelector('[data-radix-scroll-area-viewport]');
    return (viewport as HTMLElement) || activeRef.current;
  }, [activeRef]);

  // Scroll to top with animation
  const scrollToTop = useCallback(() => {
    const scrollElement = getScrollElement();
    if (scrollElement) {
      const startScrollTop = scrollElement.scrollTop;
      const duration = 500;
      const startTime = performance.now();
      
      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentScrollTop = startScrollTop * (1 - easeOutCubic);
        
        scrollElement.scrollTo({ top: currentScrollTop, behavior: 'auto' });
        
        if (progress < 1) requestAnimationFrame(animateScroll);
      };
      
      requestAnimationFrame(animateScroll);
      if (setActiveHeadingId) setActiveHeadingId('');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [getScrollElement, setActiveHeadingId]);

  // Scroll to specific heading
  const scrollToHeading = useCallback((id: string) => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;

    let element = document.getElementById(id);
    
    if (!element) {
      const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const foundById = Array.from(allHeadings).find(h => h.id === id);
      if (foundById) element = foundById as HTMLElement;
    }
    
    if (element) {
      const containerRect = scrollElement.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top + scrollElement.scrollTop;
      const offset = 100;
      const targetScrollTop = Math.max(0, relativeTop - offset);
      
      const startScrollTop = scrollElement.scrollTop;
      const distance = targetScrollTop - startScrollTop;
      const duration = 300;
      const startTime = performance.now();
      
      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentScrollTop = startScrollTop + distance * easeOutCubic;
        
        scrollElement.scrollTo({ top: currentScrollTop, behavior: 'auto' });
        
        if (progress < 1) requestAnimationFrame(animateScroll);
      };
      
      requestAnimationFrame(animateScroll);
      if (setActiveHeadingId) setActiveHeadingId(id);
    }
  }, [getScrollElement, setActiveHeadingId]);

  // Save scroll position to localStorage
  const saveScrollPosition = useCallback(() => {
    if (!filePath) return;
    const scrollElement = getScrollElement();
    
    if (scrollElement) {
      const scrollTop = scrollElement.scrollTop;
      const scrollKey = `scroll-${filePath}`;
      localStorage.setItem(scrollKey, scrollTop.toString());
    }
  }, [filePath, getScrollElement]);

  // Restore scroll position from localStorage
  const restoreScrollPosition = useCallback(() => {
    if (!filePath) return;
    
    const scrollKey = `scroll-${filePath}`;
    const savedPosition = localStorage.getItem(scrollKey);
    
    if (savedPosition) {
      const scrollElement = getScrollElement();
      if (scrollElement) {
        const targetPosition = parseInt(savedPosition, 10);
        setTimeout(() => {
          scrollElement.scrollTo({ top: targetPosition, behavior: 'auto' });
        }, 200);
      }
    }
  }, [filePath, getScrollElement]);

  // Clear saved scroll position
  const clearScrollPosition = useCallback(() => {
    if (!filePath) return;
    const scrollKey = `scroll-${filePath}`;
    localStorage.removeItem(scrollKey);
  }, [filePath]);

  // Handle scroll event updates
  const handleScroll = useCallback(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const scrollableHeight = scrollHeight - clientHeight;
    
    if (scrollableHeight > 0) {
      const progress = (scrollTop / scrollableHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    }
    
    setShowBackToTop(scrollTop > threshold);
    
    // Debounced save
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      saveScrollPosition();
    }, 500);
  }, [getScrollElement, threshold, saveScrollPosition]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    scrollProgress,
    showBackToTop,
    scrollToTop,
    scrollToHeading,
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
    handleScroll
  };
}
