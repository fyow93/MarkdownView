/**
 * Tests for useKeyboardShortcuts hook
 * TDD: Testing keyboard shortcuts functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

// Helper to get keydown handler from spy
const getKeydownHandler = (spy: ReturnType<typeof vi.spyOn>) => {
  const call = spy.mock.calls.find((c: unknown[]) => c[0] === 'keydown') as [string, (e: KeyboardEvent) => void] | undefined;
  return call?.[1] as ((e: KeyboardEvent) => void) | undefined;
};

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register keyboard event listener on mount', () => {
    renderHook(() => useKeyboardShortcuts({}));
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should unregister keyboard event listener on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts({}));
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should call onScrollToTop when pressing Home', () => {
    const onScrollToTop = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onScrollToTop }));

    const keydownHandler = getKeydownHandler(addEventListenerSpy);

    act(() => {
      keydownHandler?.(new KeyboardEvent('keydown', { key: 'Home' }));
    });

    expect(onScrollToTop).toHaveBeenCalledTimes(1);
  });

  it('should call onScrollToBottom when pressing End', () => {
    const onScrollToBottom = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onScrollToBottom }));

    const keydownHandler = getKeydownHandler(addEventListenerSpy);

    act(() => {
      keydownHandler?.(new KeyboardEvent('keydown', { key: 'End' }));
    });

    expect(onScrollToBottom).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleToc when pressing Ctrl+B', () => {
    const onToggleToc = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggleToc }));

    const keydownHandler = getKeydownHandler(addEventListenerSpy);

    act(() => {
      keydownHandler?.(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }));
    });

    expect(onToggleToc).toHaveBeenCalledTimes(1);
  });

  it('should call onFocusSearch when pressing Ctrl+K', () => {
    const onFocusSearch = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onFocusSearch }));

    const keydownHandler = getKeydownHandler(addEventListenerSpy);

    act(() => {
      keydownHandler?.(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });

    expect(onFocusSearch).toHaveBeenCalledTimes(1);
  });

  it('should call onRefresh when pressing Ctrl+R', () => {
    const onRefresh = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onRefresh }));

    const keydownHandler = getKeydownHandler(addEventListenerSpy);

    act(() => {
      keydownHandler?.(new KeyboardEvent('keydown', { key: 'r', ctrlKey: true }));
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('should not trigger shortcuts when typing in input', () => {
    const onScrollToTop = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onScrollToTop }));

    const keydownHandler = getKeydownHandler(addEventListenerSpy);

    // Create a mock event with input as target
    const event = new KeyboardEvent('keydown', { key: 'Home' });
    Object.defineProperty(event, 'target', {
      value: { tagName: 'INPUT' },
      writable: false
    });

    act(() => {
      keydownHandler?.(event);
    });

    expect(onScrollToTop).not.toHaveBeenCalled();
  });

  it('should not trigger shortcuts when disabled', () => {
    const onScrollToTop = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onScrollToTop, enabled: false }));

    const keydownHandler = getKeydownHandler(addEventListenerSpy);

    act(() => {
      keydownHandler?.(new KeyboardEvent('keydown', { key: 'Home' }));
    });

    expect(onScrollToTop).not.toHaveBeenCalled();
  });

  it('should call onNextHeading when pressing Ctrl+Down', () => {
    const onNextHeading = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onNextHeading }));

    const keydownHandler = getKeydownHandler(addEventListenerSpy);

    act(() => {
      keydownHandler?.(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true }));
    });

    expect(onNextHeading).toHaveBeenCalledTimes(1);
  });

  it('should call onPrevHeading when pressing Ctrl+Up', () => {
    const onPrevHeading = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onPrevHeading }));

    const keydownHandler = getKeydownHandler(addEventListenerSpy);

    act(() => {
      keydownHandler?.(new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true }));
    });

    expect(onPrevHeading).toHaveBeenCalledTimes(1);
  });
});
