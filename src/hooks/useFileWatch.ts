'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * File change event from SSE
 */
export interface FileWatchEvent {
  type: 'file:changed' | 'file:deleted' | 'connected' | 'error';
  timestamp: number;
  data: {
    filePath?: string;
    lastModified?: string;
    message?: string;
  };
}

/**
 * Options for useFileWatch hook
 */
export interface UseFileWatchOptions {
  /** Whether the watcher is enabled */
  enabled?: boolean;
  /** File path to watch (required for connection) */
  filePath?: string;
  /** Callback when file changes */
  onFileChanged?: (data: FileWatchEvent['data']) => void;
  /** Callback on connection error */
  onError?: (error: Error) => void;
}

/**
 * Result interface for useFileWatch hook
 */
export interface UseFileWatchResult {
  /** Whether connected to the SSE endpoint */
  isConnected: boolean;
  /** Last received event */
  lastEvent: FileWatchEvent | null;
}

/**
 * Check if a file path is a copilot session API path
 * These paths are served via /api/copilot-sessions/file/... and should NOT
 * be watched via the file-watch endpoint (which expects real file paths)
 */
export function isCopilotSessionPath(filePath: string): boolean {
  return filePath.startsWith('/api/copilot-sessions/');
}

/**
 * Hook to watch file changes via SSE (Server-Sent Events)
 * 
 * Uses Next.js API route for file watching, eliminating the need
 * for a separate Socket.IO server during development.
 * 
 * @param options - Hook configuration options
 * @returns Connection state and last event data
 * 
 * @example
 * ```tsx
 * const { isConnected, lastEvent } = useFileWatch({
 *   enabled: true,
 *   filePath: 'docs/README.md',
 *   onFileChanged: (data) => {
 *     console.log('File changed:', data.filePath);
 *     reloadContent();
 *   }
 * });
 * ```
 */
export function useFileWatch(
  options: UseFileWatchOptions = {}
): UseFileWatchResult {
  const { 
    enabled = true, 
    filePath, 
    onFileChanged, 
    onError 
  } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<FileWatchEvent | null>(null);
  
  // Use refs for callbacks to avoid re-creating EventSource on callback changes
  const onFileChangedRef = useRef(onFileChanged);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onFileChangedRef.current = onFileChanged;
  }, [onFileChanged]);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as FileWatchEvent;
      setLastEvent(data);
      
      if (data.type === 'file:changed' && onFileChangedRef.current) {
        onFileChangedRef.current(data.data);
      }
    } catch (err) {
      console.error('Failed to parse SSE message:', err);
    }
  }, []);
  
  const handleError = useCallback(() => {
    setIsConnected(false);
    
    if (onErrorRef.current) {
      onErrorRef.current(new Error('SSE connection error'));
    }
  }, []);
  
  useEffect(() => {
    // Don't connect if disabled or no filePath
    if (!enabled || !filePath) {
      return;
    }
    
    // Don't connect to file-watch for copilot session API paths
    // These are virtual paths served by the API, not real file paths
    // Copilot sessions have their own watch endpoint at /api/copilot-sessions/watch
    if (isCopilotSessionPath(filePath)) {
      return;
    }
    
    // Build SSE URL with encoded file path
    const encodedPath = encodeURIComponent(filePath);
    const url = `/api/file-watch?path=${encodedPath}`;
    
    // Create EventSource connection
    const eventSource = new EventSource(url);
    
    eventSource.onopen = () => {
      setIsConnected(true);
    };
    
    eventSource.onmessage = handleMessage;
    eventSource.onerror = handleError;
    
    // Cleanup on unmount or when dependencies change
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [enabled, filePath, handleMessage, handleError]);
  
  return {
    isConnected,
    lastEvent,
  };
}
