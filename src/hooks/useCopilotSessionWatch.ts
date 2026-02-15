'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

/**
 * Event types from SSE
 */
export type SessionEventType =
  | 'connected'
  | 'session:created'
  | 'file:created'
  | 'file:updated'
  | 'file:deleted';

/**
 * Session event data
 */
export interface SessionEvent {
  type: SessionEventType;
  data: SessionEventData;
  timestamp: number;
}

/**
 * Data for session-related events
 */
export interface SessionCreatedData {
  sessionId: string;
  path: string;
}

/**
 * Data for file-related events
 */
export interface FileEventData {
  sessionId: string;
  path: string;
  relativePath: string;
  type: 'plan' | 'checkpoint' | 'file';
}

/**
 * Union type for event data
 */
export type SessionEventData = SessionCreatedData | FileEventData;

/**
 * Options for useCopilotSessionWatch hook
 */
export interface UseCopilotSessionWatchOptions {
  enabled?: boolean;
  onSessionCreated?: (data: SessionCreatedData) => void;
  onFileCreated?: (data: FileEventData) => void;
  onFileUpdated?: (data: FileEventData) => void;
  onFileDeleted?: (data: FileEventData) => void;
  reconnectDelay?: number;
  maxEvents?: number;
}

/**
 * Return type for useCopilotSessionWatch hook
 */
export interface UseCopilotSessionWatchResult {
  isConnected: boolean;
  events: SessionEvent[];
  updatedSessions: Set<string>;
  clearUpdated: (sessionId: string) => void;
  clearAllUpdated: () => void;
}

/**
 * Hook to watch Copilot CLI session updates via Server-Sent Events (SSE)
 * 
 * Provides real-time updates when sessions are created or files are modified.
 * Automatically reconnects on connection loss.
 * 
 * @param options - Configuration options for the hook
 * @returns Connection state, events, updated sessions tracker, and clear functions
 * 
 * @example
 * ```tsx
 * // Basic usage with callbacks
 * const { isConnected, updatedSessions } = useCopilotSessionWatch({
 *   enabled: true,
 *   onFileUpdated: (data) => {
 *     console.log('File updated:', data.relativePath);
 *     refreshContent();
 *   },
 *   onSessionCreated: (data) => {
 *     console.log('New session:', data.sessionId);
 *   }
 * });
 * 
 * // Clear update indicator after viewing
 * const handleSessionClick = (sessionId: string) => {
 *   clearUpdated(sessionId);
 * };
 * ```
 */
export function useCopilotSessionWatch(
  options: UseCopilotSessionWatchOptions = {}
): UseCopilotSessionWatchResult {
  const {
    enabled = true,
    onSessionCreated,
    onFileCreated,
    onFileUpdated,
    onFileDeleted,
    reconnectDelay = 5000,
    maxEvents = 100,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [updatedSessions, setUpdatedSessions] = useState<Set<string>>(new Set());

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectRef = useRef<(() => void) | undefined>(undefined);

  // Store callbacks in refs to avoid reconnection on callback change
  const callbacksRef = useRef({
    onSessionCreated,
    onFileCreated,
    onFileUpdated,
    onFileDeleted,
  });

  useEffect(() => {
    callbacksRef.current = {
      onSessionCreated,
      onFileCreated,
      onFileUpdated,
      onFileDeleted,
    };
  }, [onSessionCreated, onFileCreated, onFileUpdated, onFileDeleted]);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/copilot-sessions/watch');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data) as {
          type: SessionEventType;
          data: SessionEventData;
        };

        const sessionEvent: SessionEvent = {
          type,
          data,
          timestamp: Date.now(),
        };

        // Add to events list (capped at maxEvents)
        setEvents((prev) => {
          const newEvents = [sessionEvent, ...prev];
          return newEvents.slice(0, maxEvents);
        });

        // Track updated sessions
        const sessionId =
          'sessionId' in data ? data.sessionId : undefined;

        if (sessionId && type !== 'connected') {
          setUpdatedSessions((prev) => {
            const newSet = new Set(prev);
            newSet.add(sessionId);
            return newSet;
          });
        }

        // Call appropriate callback
        switch (type) {
          case 'session:created':
            callbacksRef.current.onSessionCreated?.(data as SessionCreatedData);
            break;
          case 'file:created':
            callbacksRef.current.onFileCreated?.(data as FileEventData);
            break;
          case 'file:updated':
            callbacksRef.current.onFileUpdated?.(data as FileEventData);
            break;
          case 'file:deleted':
            callbacksRef.current.onFileDeleted?.(data as FileEventData);
            break;
        }
      } catch (err) {
        logger.error('Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();

      // Attempt reconnection
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current?.();
        }, reconnectDelay);
      }
    };
  }, [enabled, maxEvents, reconnectDelay]);

  // Keep connectRef in sync with connect function
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Connect when enabled
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, connect]);

  const clearUpdated = useCallback((sessionId: string) => {
    setUpdatedSessions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(sessionId);
      return newSet;
    });
  }, []);

  const clearAllUpdated = useCallback(() => {
    setUpdatedSessions(new Set());
  }, []);

  return {
    isConnected,
    events,
    updatedSessions,
    clearUpdated,
    clearAllUpdated,
  };
}
