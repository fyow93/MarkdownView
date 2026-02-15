/**
 * Tests for useFileWatch hook
 * 
 * TDD RED Phase: Write tests before implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileWatch } from '../useFileWatch';

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  readyState: number = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
    // Simulate connection after a tick
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  close() {
    this.readyState = 2;
  }

  // Helper to simulate server message
  simulateMessage(data: object) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', {
        data: JSON.stringify(data)
      }));
    }
  }

  // Helper to simulate error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  static reset() {
    MockEventSource.instances = [];
  }
}

// Store original EventSource
const originalEventSource = global.EventSource;

describe('useFileWatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockEventSource.reset();
    // @ts-expect-error - Mocking global EventSource
    global.EventSource = MockEventSource;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.EventSource = originalEventSource;
  });

  it('should not connect when disabled', () => {
    renderHook(() => useFileWatch({ enabled: false }));
    expect(MockEventSource.instances.length).toBe(0);
  });

  it('should not connect when no filePath is provided', () => {
    renderHook(() => useFileWatch({ enabled: true }));
    expect(MockEventSource.instances.length).toBe(0);
  });

  it('should connect when enabled with filePath', async () => {
    renderHook(() => useFileWatch({ 
      enabled: true, 
      filePath: 'test.md' 
    }));
    
    expect(MockEventSource.instances.length).toBe(1);
    expect(MockEventSource.instances[0].url).toContain('/api/file-watch');
    expect(MockEventSource.instances[0].url).toContain('path=test.md');
  });

  it('should return initial disconnected state', () => {
    const { result } = renderHook(() => useFileWatch({ 
      enabled: true, 
      filePath: 'test.md' 
    }));
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastEvent).toBeNull();
  });

  it('should update isConnected when connection opens', async () => {
    vi.useRealTimers(); // Use real timers for this test
    
    const { result } = renderHook(() => useFileWatch({ 
      enabled: true, 
      filePath: 'test.md' 
    }));
    
    // Wait for connection (MockEventSource triggers onopen in setTimeout)
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    }, { timeout: 100 });
    
    vi.useFakeTimers(); // Restore fake timers
  });

  it('should call onFileChanged callback when file changes', async () => {
    const onFileChanged = vi.fn();
    
    renderHook(() => useFileWatch({ 
      enabled: true, 
      filePath: 'test.md',
      onFileChanged
    }));
    
    // Wait for connection
    await act(async () => {
      vi.advanceTimersByTime(10);
    });
    
    // Simulate file change event
    act(() => {
      MockEventSource.instances[0].simulateMessage({
        type: 'file:changed',
        timestamp: Date.now(),
        data: {
          filePath: 'test.md',
          lastModified: new Date().toISOString()
        }
      });
    });
    
    expect(onFileChanged).toHaveBeenCalledWith(expect.objectContaining({
      filePath: 'test.md'
    }));
  });

  it('should update lastEvent when receiving events', async () => {
    const { result } = renderHook(() => useFileWatch({ 
      enabled: true, 
      filePath: 'test.md'
    }));
    
    // Wait for connection
    await act(async () => {
      vi.advanceTimersByTime(10);
    });
    
    const eventData = {
      type: 'file:changed',
      timestamp: Date.now(),
      data: {
        filePath: 'test.md',
        lastModified: new Date().toISOString()
      }
    };
    
    // Simulate file change event
    act(() => {
      MockEventSource.instances[0].simulateMessage(eventData);
    });
    
    expect(result.current.lastEvent).toEqual(eventData);
  });

  it('should close connection when disabled', async () => {
    const { rerender } = renderHook(
      ({ enabled, filePath }) => useFileWatch({ enabled, filePath }), 
      { initialProps: { enabled: true, filePath: 'test.md' } }
    );
    
    expect(MockEventSource.instances.length).toBe(1);
    const firstInstance = MockEventSource.instances[0];
    
    // Disable the hook
    rerender({ enabled: false, filePath: 'test.md' });
    
    expect(firstInstance.readyState).toBe(2); // Closed
  });

  it('should reconnect when filePath changes', async () => {
    const { rerender } = renderHook(
      ({ filePath }) => useFileWatch({ enabled: true, filePath }), 
      { initialProps: { filePath: 'test1.md' } }
    );
    
    expect(MockEventSource.instances.length).toBe(1);
    expect(MockEventSource.instances[0].url).toContain('path=test1.md');
    
    // Change file path
    rerender({ filePath: 'test2.md' });
    
    expect(MockEventSource.instances.length).toBe(2);
    expect(MockEventSource.instances[1].url).toContain('path=test2.md');
  });

  it('should handle connection errors gracefully', async () => {
    const onError = vi.fn();
    
    const { result } = renderHook(() => useFileWatch({ 
      enabled: true, 
      filePath: 'test.md',
      onError
    }));
    
    // Wait for connection
    await act(async () => {
      vi.advanceTimersByTime(10);
    });
    
    // Simulate error
    act(() => {
      MockEventSource.instances[0].simulateError();
    });
    
    expect(result.current.isConnected).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useFileWatch({ 
      enabled: true, 
      filePath: 'test.md' 
    }));
    
    expect(MockEventSource.instances.length).toBe(1);
    const instance = MockEventSource.instances[0];
    
    unmount();
    
    expect(instance.readyState).toBe(2); // Closed
  });

  it('should encode special characters in filePath', () => {
    renderHook(() => useFileWatch({ 
      enabled: true, 
      filePath: 'docs/测试文件.md' 
    }));
    
    expect(MockEventSource.instances.length).toBe(1);
    // URL should be encoded
    expect(MockEventSource.instances[0].url).toContain(encodeURIComponent('docs/测试文件.md'));
  });

  describe('Copilot session paths', () => {
    it('should not connect to file-watch for copilot session paths', () => {
      renderHook(() => useFileWatch({ 
        enabled: true, 
        filePath: '/api/copilot-sessions/file/ffafd583-7cbf-45e9-b000-edae2dd9ad74/checkpoints/index.md' 
      }));
      
      // Should NOT connect to file-watch endpoint for copilot session paths
      expect(MockEventSource.instances.length).toBe(0);
    });

    it('should detect copilot session file paths correctly', () => {
      const copilotPaths = [
        '/api/copilot-sessions/file/abc-123/plan.md',
        '/api/copilot-sessions/file/abc-123/checkpoints/index.md',
        '/api/copilot-sessions/file/abc-123/files/test.md',
      ];

      for (const filePath of copilotPaths) {
        renderHook(() => useFileWatch({ 
          enabled: true, 
          filePath, 
        }));
      }
      
      // None should connect to file-watch
      expect(MockEventSource.instances.length).toBe(0);
    });

    it('should connect to file-watch for regular file paths', () => {
      const regularPaths = [
        'docs/README.md',
        'example.md',
        '/absolute/path/test.md',
      ];

      for (const filePath of regularPaths) {
        MockEventSource.reset();
        renderHook(() => useFileWatch({ 
          enabled: true, 
          filePath, 
        }));
        expect(MockEventSource.instances.length).toBe(1);
      }
    });
  });
});
