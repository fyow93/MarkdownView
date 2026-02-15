'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Session metadata returned from API
 */
export interface SessionMetadata {
  id: string;
  workingDirectory: string | null;
  createdAt: number;
  lastModified: number;
  fileCount: number;
}

/**
 * Options for useCopilotSessions hook
 */
export interface UseCopilotSessionsOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'lastModified' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Return type for useCopilotSessions hook
 */
export interface UseCopilotSessionsResult {
  sessions: SessionMetadata[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  count: number;
}

/**
 * Hook to fetch and manage Copilot CLI sessions
 * 
 * Provides session listing with pagination, sorting, and auto-refresh capabilities.
 * 
 * @param options - Configuration options for the hook
 * @returns Session data, loading state, error state, and refresh function
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const { sessions, isLoading, error } = useCopilotSessions();
 * 
 * // With pagination and auto-refresh
 * const { sessions, refresh } = useCopilotSessions({
 *   limit: 10,
 *   offset: 0,
 *   sortBy: 'lastModified',
 *   autoRefresh: true,
 *   refreshInterval: 30000
 * });
 * ```
 */
export function useCopilotSessions(
  options: UseCopilotSessionsOptions = {}
): UseCopilotSessionsResult {
  const {
    limit,
    offset,
    sortBy = 'lastModified',
    sortOrder = 'desc',
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (limit !== undefined) params.set('limit', String(limit));
      if (offset !== undefined) params.set('offset', String(offset));
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('sortOrder', sortOrder);

      const url = `/api/copilot-sessions${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();

      if (data.success) {
        setSessions(data.data);
        setCount(data.count);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset, sortBy, sortOrder]);

  // Initial fetch
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchSessions, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    refresh: fetchSessions,
    count,
  };
}
