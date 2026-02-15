import { useCallback } from 'react';

interface ScrollOptions {
  offset?: number;
  duration?: number;
}

const DEFAULT_OPTIONS: ScrollOptions = {
  offset: 100,
  duration: 300
};

interface UseSmoothScrollResult {
  scrollToTop: (duration?: number) => void;
  scrollToElement: (id: string, options?: ScrollOptions) => boolean;
  getScrollPosition: () => number;
  isScrolledPast: (threshold?: number) => boolean;
  animateScrollTo: (targetScrollTop: number, duration?: number) => void;
  getScrollElement: () => Element | null;
}

/**
 * Hook for smooth scroll animations within a scroll container
 */
export function useSmoothScroll(scrollAreaRef: React.RefObject<HTMLDivElement | null>): UseSmoothScrollResult {
  
  // Get the scroll viewport element from Radix ScrollArea
  const getScrollElement = useCallback((): Element | null => {
    if (!scrollAreaRef.current) return null;
    return scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
  }, [scrollAreaRef]);

  // Easing function - easeOutCubic
  const easeOutCubic = (progress: number): number => {
    return 1 - Math.pow(1 - progress, 3);
  };

  // Animate scroll to a target position
  const animateScrollTo = useCallback((targetScrollTop: number, duration: number = 300) => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;

    const startScrollTop = scrollElement.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentScrollTop = startScrollTop + distance * easeOutCubic(progress);
      
      scrollElement.scrollTo({
        top: currentScrollTop,
        behavior: 'auto'
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [getScrollElement]);

  // Scroll to top
  const scrollToTop = useCallback((duration: number = 500) => {
    animateScrollTo(0, duration);
  }, [animateScrollTo]);

  // Scroll to a specific element by ID
  const scrollToElement = useCallback((id: string, options: ScrollOptions = DEFAULT_OPTIONS) => {
    const { offset = 100, duration = 300 } = options;
    
    // Try to find element by ID
    let element = document.getElementById(id);
    
    // Fallback: search in all headings
    if (!element) {
      const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const foundById = Array.from(allHeadings).find(h => h.id === id);
      if (foundById) {
        element = foundById as HTMLElement;
      }
    }
    
    if (!element) return false;
    
    const scrollElement = getScrollElement();
    if (!scrollElement) return false;

    const containerRect = scrollElement.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const relativeTop = elementRect.top - containerRect.top + scrollElement.scrollTop;
    const targetScrollTop = Math.max(0, relativeTop - offset);
    
    animateScrollTo(targetScrollTop, duration);
    return true;
  }, [getScrollElement, animateScrollTo]);

  // Get current scroll position
  const getScrollPosition = useCallback((): number => {
    const scrollElement = getScrollElement();
    return scrollElement?.scrollTop ?? 0;
  }, [getScrollElement]);

  // Check if scrolled past threshold (for back-to-top visibility)
  const isScrolledPast = useCallback((threshold: number = 300): boolean => {
    return getScrollPosition() > threshold;
  }, [getScrollPosition]);

  return {
    scrollToTop,
    scrollToElement,
    getScrollPosition,
    isScrolledPast,
    animateScrollTo,
    getScrollElement
  };
}
