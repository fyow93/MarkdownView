'use client';

import { useEffect, useCallback } from 'react';

/**
 * Options for useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  onScrollToTop?: () => void;
  onScrollToBottom?: () => void;
  onToggleToc?: () => void;
  onFocusSearch?: () => void;
  onRefresh?: () => void;
  onNextHeading?: () => void;
  onPrevHeading?: () => void;
  onEscape?: () => void;
  onQuickFileOpen?: () => void;
  onPrevFile?: () => void;
  onNextFile?: () => void;
  onFocusMode?: () => void;
  onShowHelp?: () => void;
}

/**
 * Keyboard shortcut definitions
 */
const SHORTCUTS = {
  SCROLL_TOP: 'Home',
  SCROLL_BOTTOM: 'End',
  TOGGLE_TOC: { key: 'b', ctrl: true },
  FOCUS_SEARCH: { key: 'k', ctrl: true },
  REFRESH: { key: 'r', ctrl: true },
  NEXT_HEADING: { key: 'ArrowDown', ctrl: true },
  PREV_HEADING: { key: 'ArrowUp', ctrl: true },
  QUICK_FILE_OPEN: { key: 'p', ctrl: true },
  PREV_FILE: { key: '[', ctrl: true },
  NEXT_FILE: { key: ']', ctrl: true },
  FOCUS_MODE: 'F11',
  SHOW_HELP: '?',
  ESCAPE: 'Escape',
} as const;

/**
 * Elements that should not trigger shortcuts
 */
const EXCLUDED_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

/**
 * Hook for handling keyboard shortcuts
 * @param options Configuration options with callbacks
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const {
    enabled = true,
    onScrollToTop,
    onScrollToBottom,
    onToggleToc,
    onFocusSearch,
    onRefresh,
    onNextHeading,
    onPrevHeading,
    onEscape,
    onQuickFileOpen,
    onPrevFile,
    onNextFile,
    onFocusMode,
    onShowHelp,
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if disabled
    if (!enabled) return;

    // Skip if typing in an input element
    const target = event.target as HTMLElement | null;
    if (target && EXCLUDED_TAGS.includes(target.tagName)) {
      return;
    }

    // Skip if contentEditable
    if (target?.isContentEditable) {
      return;
    }

    const { key, ctrlKey, metaKey } = event;
    const isModified = ctrlKey || metaKey;

    // Simple keys (no modifier)
    if (!isModified) {
      if (key === SHORTCUTS.SCROLL_TOP && onScrollToTop) {
        event.preventDefault();
        onScrollToTop();
        return;
      }
      if (key === SHORTCUTS.SCROLL_BOTTOM && onScrollToBottom) {
        event.preventDefault();
        onScrollToBottom();
        return;
      }
      if (key === SHORTCUTS.FOCUS_MODE && onFocusMode) {
        event.preventDefault();
        onFocusMode();
        return;
      }
      if (key === SHORTCUTS.SHOW_HELP && onShowHelp) {
        event.preventDefault();
        onShowHelp();
        return;
      }
      if (key === SHORTCUTS.ESCAPE && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }
    }

    // Ctrl/Cmd + key shortcuts
    if (isModified) {
      if (key.toLowerCase() === SHORTCUTS.TOGGLE_TOC.key && onToggleToc) {
        event.preventDefault();
        onToggleToc();
        return;
      }
      if (key.toLowerCase() === SHORTCUTS.FOCUS_SEARCH.key && onFocusSearch) {
        event.preventDefault();
        onFocusSearch();
        return;
      }
      if (key.toLowerCase() === SHORTCUTS.REFRESH.key && onRefresh) {
        event.preventDefault();
        onRefresh();
        return;
      }
      if (key === SHORTCUTS.NEXT_HEADING.key && onNextHeading) {
        event.preventDefault();
        onNextHeading();
        return;
      }
      if (key === SHORTCUTS.PREV_HEADING.key && onPrevHeading) {
        event.preventDefault();
        onPrevHeading();
        return;
      }
      if (key.toLowerCase() === SHORTCUTS.QUICK_FILE_OPEN.key && onQuickFileOpen) {
        event.preventDefault();
        onQuickFileOpen();
        return;
      }
      if (key === SHORTCUTS.PREV_FILE.key && onPrevFile) {
        event.preventDefault();
        onPrevFile();
        return;
      }
      if (key === SHORTCUTS.NEXT_FILE.key && onNextFile) {
        event.preventDefault();
        onNextFile();
        return;
      }
    }
  }, [
    enabled,
    onScrollToTop,
    onScrollToBottom,
    onToggleToc,
    onFocusSearch,
    onRefresh,
    onNextHeading,
    onPrevHeading,
    onEscape,
    onQuickFileOpen,
    onPrevFile,
    onNextFile,
    onFocusMode,
    onShowHelp,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
