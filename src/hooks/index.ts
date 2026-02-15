export { useToc } from './useToc';
export type { TocItem } from './useToc';
export { useSmoothScroll } from './useSmoothScroll';

// Markdown loading and scroll hooks
export { useMarkdownLoader } from './useMarkdownLoader';
export type {
  TocItem as MarkdownTocItem,
  UseMarkdownLoaderOptions,
  UseMarkdownLoaderResult,
} from './useMarkdownLoader';

export { useScrollPosition } from './useScrollPosition';
export type {
  UseScrollPositionOptions,
  UseScrollPositionResult,
} from './useScrollPosition';

// Keyboard shortcuts
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export type { UseKeyboardShortcutsOptions } from './useKeyboardShortcuts';

// Copilot CLI session hooks
export { useCopilotSessions } from './useCopilotSessions';
export type {
  SessionMetadata,
  UseCopilotSessionsOptions,
  UseCopilotSessionsResult,
} from './useCopilotSessions';

export { useCopilotSessionWatch } from './useCopilotSessionWatch';
export type {
  SessionEventType,
  SessionEvent,
  SessionCreatedData,
  FileEventData,
  SessionEventData,
  UseCopilotSessionWatchOptions,
  UseCopilotSessionWatchResult,
} from './useCopilotSessionWatch';

// File watch hook for hot reload
export { useFileWatch, isCopilotSessionPath } from './useFileWatch';
export type {
  FileWatchEvent,
  UseFileWatchOptions,
  UseFileWatchResult,
} from './useFileWatch';
