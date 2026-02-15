/**
 * Tests for useScrollPosition hook
 * TDD: Tests for scroll position tracking and utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollPosition } from '../useScrollPosition';

// Mock window methods
const mockScrollTo = vi.fn();

describe('useScrollPosition', () => {
  let mockViewport: HTMLDivElement;
  let mockContainer: HTMLDivElement;

  beforeEach(() => {
    mockViewport = document.createElement('div');
    mockViewport.setAttribute('data-radix-scroll-area-viewport', '');
    Object.defineProperties(mockViewport, {
      scrollTop: { value: 0, writable: true, configurable: true },
      scrollHeight: { value: 2000, writable: true },
      clientHeight: { value: 500, writable: true },
      scrollTo: { value: mockScrollTo, writable: true },
    });

    mockContainer = document.createElement('div');
    mockContainer.appendChild(mockViewport);
    
    window.scrollTo = mockScrollTo;
    
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    
    let rafCallCount = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallCount++;
      if (rafCallCount <= 10) {
        setTimeout(() => cb(performance.now()), 0);
      }
      return rafCallCount;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should return initial scroll position of 0', () => {
    const { result } = renderHook(() => useScrollPosition());
    expect(result.current.scrollProgress).toBe(0);
  });

  it('should indicate not at top initially', () => {
    const { result } = renderHook(() => useScrollPosition());
    expect(result.current.showBackToTop).toBe(false);
  });

  it('should update scroll position when handleScroll is called', () => {
    const containerRef = { current: mockContainer };
    const { result } = renderHook(() => useScrollPosition({
      containerRef,
    }));

    // Simulate scroll to 50%
    Object.defineProperty(mockViewport, 'scrollTop', { value: 750, writable: true });

    act(() => {
      result.current.handleScroll();
    });

    expect(result.current.scrollProgress).toBeCloseTo(50, 0);
  });

  it('should show back to top button after scrolling threshold', () => {
    const containerRef = { current: mockContainer };
    const { result } = renderHook(() => useScrollPosition({
      containerRef,
      threshold: 200,
    }));

    // Scroll past threshold
    Object.defineProperty(mockViewport, 'scrollTop', { value: 250, writable: true });

    act(() => {
      result.current.handleScroll();
    });

    expect(result.current.showBackToTop).toBe(true);
  });

  it('should hide back to top when below threshold', () => {
    const containerRef = { current: mockContainer };
    const { result } = renderHook(() => useScrollPosition({
      containerRef,
      threshold: 200,
    }));

    // Scroll past threshold then back
    Object.defineProperty(mockViewport, 'scrollTop', { value: 250, writable: true });
    act(() => { result.current.handleScroll(); });
    
    Object.defineProperty(mockViewport, 'scrollTop', { value: 100, writable: true });
    act(() => { result.current.handleScroll(); });

    expect(result.current.showBackToTop).toBe(false);
  });

  it('should call scrollTo when scrollToTop is called', async () => {
    const containerRef = { current: mockContainer };
    const { result } = renderHook(() => useScrollPosition({
      containerRef,
    }));

    Object.defineProperty(mockViewport, 'scrollTop', { value: 500, writable: true, configurable: true });

    act(() => {
      result.current.scrollToTop();
    });

    await vi.waitFor(() => {
      expect(mockScrollTo).toHaveBeenCalled();
    });
  });

  it('should use custom threshold', () => {
    const containerRef = { current: mockContainer };
    const { result } = renderHook(() => useScrollPosition({
      containerRef,
      threshold: 500,
    }));

    Object.defineProperty(mockViewport, 'scrollTop', { value: 400, writable: true });
    act(() => { result.current.handleScroll(); });
    expect(result.current.showBackToTop).toBe(false);

    Object.defineProperty(mockViewport, 'scrollTop', { value: 600, writable: true });
    act(() => { result.current.handleScroll(); });
    expect(result.current.showBackToTop).toBe(true);
  });

  it('should fall back to window.scrollTo when no container ref', () => {
    const { result } = renderHook(() => useScrollPosition());

    act(() => {
      result.current.scrollToTop();
    });

    expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
