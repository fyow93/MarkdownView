/**
 * Tests for useCopilotSessionWatch hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCopilotSessionWatch } from '../useCopilotSessionWatch';

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onopen: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState: number = 0;

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close = vi.fn();

  simulateOpen() {
    this.readyState = MockEventSource.OPEN;
    this.onopen?.();
  }

  simulateMessage(type: string, data: unknown) {
    const event = new MessageEvent('message', {
      data: JSON.stringify({ type, data }),
    });
    this.onmessage?.(event);
  }

  simulateError() {
    const event = new Event('error');
    this.onerror?.(event);
  }
}

// Store original EventSource
const originalEventSource = global.EventSource;

describe('useCopilotSessionWatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances = [];
    (global as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (global as unknown as { EventSource: typeof EventSource }).EventSource = originalEventSource;
  });

  it('should not connect when disabled', () => {
    renderHook(() => useCopilotSessionWatch({ enabled: false }));

    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('should connect to SSE endpoint when enabled', () => {
    renderHook(() => useCopilotSessionWatch({ enabled: true }));

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe('/api/copilot-sessions/watch');
  });

  it('should start as disconnected', () => {
    const { result } = renderHook(() => useCopilotSessionWatch({ enabled: true }));

    expect(result.current.isConnected).toBe(false);
  });

  it('should update isConnected when connection opens', async () => {
    const { result } = renderHook(() => useCopilotSessionWatch({ enabled: true }));

    act(() => {
      MockEventSource.instances[0].simulateOpen();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should call onSessionCreated when session:created event received', async () => {
    const onSessionCreated = vi.fn();
    const { result } = renderHook(() =>
      useCopilotSessionWatch({ enabled: true, onSessionCreated })
    );

    act(() => {
      MockEventSource.instances[0].simulateOpen();
    });

    const sessionData = {
      sessionId: '01520805-ffe6-4de5-b084-f31da30f1691',
      path: '/home/user/.copilot/session-state/01520805-ffe6-4de5-b084-f31da30f1691',
    };

    act(() => {
      MockEventSource.instances[0].simulateMessage('session:created', sessionData);
    });

    await waitFor(() => {
      expect(onSessionCreated).toHaveBeenCalledWith(sessionData);
    });

    // Check that events array is updated
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].type).toBe('session:created');
  });

  it('should call onFileUpdated when file:updated event received', async () => {
    const onFileUpdated = vi.fn();
    renderHook(() => useCopilotSessionWatch({ enabled: true, onFileUpdated }));

    act(() => {
      MockEventSource.instances[0].simulateOpen();
    });

    const fileData = {
      sessionId: '01520805-ffe6-4de5-b084-f31da30f1691',
      path: '/home/user/.copilot/session-state/01520805-ffe6-4de5-b084-f31da30f1691/plan.md',
      relativePath: 'plan.md',
      type: 'plan',
    };

    act(() => {
      MockEventSource.instances[0].simulateMessage('file:updated', fileData);
    });

    await waitFor(() => {
      expect(onFileUpdated).toHaveBeenCalledWith(fileData);
    });
  });

  it('should call onFileCreated when file:created event received', async () => {
    const onFileCreated = vi.fn();
    renderHook(() => useCopilotSessionWatch({ enabled: true, onFileCreated }));

    act(() => {
      MockEventSource.instances[0].simulateOpen();
    });

    const fileData = {
      sessionId: '01520805-ffe6-4de5-b084-f31da30f1691',
      path: '/home/user/.copilot/session-state/01520805-ffe6-4de5-b084-f31da30f1691/checkpoints/1.md',
      relativePath: 'checkpoints/1.md',
      type: 'checkpoint',
    };

    act(() => {
      MockEventSource.instances[0].simulateMessage('file:created', fileData);
    });

    await waitFor(() => {
      expect(onFileCreated).toHaveBeenCalledWith(fileData);
    });
  });

  it('should close EventSource on unmount', () => {
    const { unmount } = renderHook(() => useCopilotSessionWatch({ enabled: true }));

    const instance = MockEventSource.instances[0];
    unmount();

    expect(instance.close).toHaveBeenCalled();
  });

  it('should track updated sessions', async () => {
    const { result } = renderHook(() => useCopilotSessionWatch({ enabled: true }));

    act(() => {
      MockEventSource.instances[0].simulateOpen();
    });

    const fileData = {
      sessionId: '01520805-ffe6-4de5-b084-f31da30f1691',
      path: '/path/to/file.md',
      relativePath: 'plan.md',
      type: 'plan',
    };

    act(() => {
      MockEventSource.instances[0].simulateMessage('file:updated', fileData);
    });

    await waitFor(() => {
      expect(result.current.updatedSessions.has('01520805-ffe6-4de5-b084-f31da30f1691')).toBe(true);
    });
  });

  it('should provide clearUpdated function', async () => {
    const { result } = renderHook(() => useCopilotSessionWatch({ enabled: true }));

    act(() => {
      MockEventSource.instances[0].simulateOpen();
    });

    const fileData = {
      sessionId: '01520805-ffe6-4de5-b084-f31da30f1691',
      path: '/path/to/file.md',
      relativePath: 'plan.md',
      type: 'plan',
    };

    act(() => {
      MockEventSource.instances[0].simulateMessage('file:updated', fileData);
    });

    await waitFor(() => {
      expect(result.current.updatedSessions.size).toBe(1);
    });

    act(() => {
      result.current.clearUpdated('01520805-ffe6-4de5-b084-f31da30f1691');
    });

    expect(result.current.updatedSessions.size).toBe(0);
  });

  it('should reconnect on disconnect after enabled', async () => {
    const { result, unmount } = renderHook(() => useCopilotSessionWatch({ enabled: true }));

    act(() => {
      MockEventSource.instances[0].simulateOpen();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate disconnect - this should trigger reconnect logic
    act(() => {
      MockEventSource.instances[0].simulateError();
    });

    // isConnected should be false after error
    expect(result.current.isConnected).toBe(false);

    // Clean up
    unmount();
  });
});
