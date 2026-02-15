/**
 * Tests for useCopilotSessions hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCopilotSessions } from '../useCopilotSessions';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useCopilotSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with loading state', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [], count: 0 }),
    });

    const { result } = renderHook(() => useCopilotSessions());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.sessions).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should fetch sessions on mount', async () => {
    const mockSessions = [
      {
        id: '01520805-ffe6-4de5-b084-f31da30f1691',
        workingDirectory: '/home/user/project',
        createdAt: Date.now() - 1000,
        lastModified: Date.now(),
        fileCount: 3,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockSessions, count: 1 }),
    });

    const { result } = renderHook(() => useCopilotSessions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toEqual(mockSessions);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/copilot-sessions'),
      expect.any(Object)
    );
  });

  it('should handle fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ success: false, error: 'Server error' }),
    });

    const { result } = renderHook(() => useCopilotSessions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch sessions');
    expect(result.current.sessions).toEqual([]);
  });

  it('should provide refresh function', async () => {
    const mockSessions = [
      {
        id: '01520805-ffe6-4de5-b084-f31da30f1691',
        workingDirectory: '/home/user/project',
        createdAt: Date.now(),
        lastModified: Date.now(),
        fileCount: 1,
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockSessions, count: 1 }),
    });

    const { result } = renderHook(() => useCopilotSessions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Call refresh
    await act(async () => {
      await result.current.refresh();
    });

    // Should have been called twice (initial + refresh)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should pass pagination options', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [], count: 0 }),
    });

    renderHook(() => useCopilotSessions({ limit: 10, offset: 5 }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const fetchCall = mockFetch.mock.calls[0][0];
    expect(fetchCall).toContain('limit=10');
    expect(fetchCall).toContain('offset=5');
  });
});
