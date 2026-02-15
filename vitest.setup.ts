import '@testing-library/jest-dom/vitest';

// Mock EventSource for SSE tests
class MockEventSource {
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
  }

  close() {}
}

// Only assign if not already defined
if (typeof global.EventSource === 'undefined') {
  (global as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;
}
