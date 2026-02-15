/**
 * Tests for File Watch API Route
 * 
 * TDD RED Phase: Write tests before implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock chokidar before importing
vi.mock('chokidar', () => ({
  default: {
    watch: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      close: vi.fn().mockResolvedValue(undefined),
      add: vi.fn(),
      unwatch: vi.fn(),
    })),
  },
}));

// Mock config
vi.mock('../../../../../config.js', () => ({
  default: {
    PROJECT_ROOT: '/mock/project/root',
  },
}));

// Mock fs with default existsSync returning true
const mockExistsSync = vi.fn(() => true);
const mockStatSync = vi.fn(() => ({ mtime: new Date() }));

vi.mock('fs', () => ({
  default: {
    existsSync: mockExistsSync,
    statSync: mockStatSync,
  },
  existsSync: mockExistsSync,
  statSync: mockStatSync,
}));

describe('File Watch API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mtime: new Date() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/file-watch', () => {
    it('should return 400 if path parameter is missing', async () => {
      // Import after mocks are set up
      const { GET } = await import('../route');
      const { NextRequest } = await import('next/server');
      
      const request = new NextRequest('http://localhost:3000/api/file-watch');
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('path');
    });

    it('should return 400 if path does not end with .md', async () => {
      const { GET } = await import('../route');
      const { NextRequest } = await import('next/server');
      
      const request = new NextRequest('http://localhost:3000/api/file-watch?path=test.txt');
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Markdown');
    });

    it('should return 403 if path contains directory traversal', async () => {
      const { GET } = await import('../route');
      const { NextRequest } = await import('next/server');
      
      const request = new NextRequest('http://localhost:3000/api/file-watch?path=../../../etc/passwd.md');
      const response = await GET(request);
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('拒绝');
    });

    it('should return 404 if file does not exist', async () => {
      mockExistsSync.mockReturnValue(false);
      
      const { GET } = await import('../route');
      const { NextRequest } = await import('next/server');
      
      const request = new NextRequest('http://localhost:3000/api/file-watch?path=notfound.md');
      const response = await GET(request);
      
      expect(response.status).toBe(404);
    });

    it('should return SSE stream for valid file path', async () => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ mtime: new Date() });
      
      const { GET } = await import('../route');
      const { NextRequest } = await import('next/server');
      
      const request = new NextRequest('http://localhost:3000/api/file-watch?path=test.md');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
    });

    it('should handle URL encoded file paths', async () => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ mtime: new Date() });
      
      const { GET } = await import('../route');
      const { NextRequest } = await import('next/server');
      
      // URL encoded path with Chinese characters
      const encodedPath = encodeURIComponent('docs/测试文件.md');
      const request = new NextRequest(`http://localhost:3000/api/file-watch?path=${encodedPath}`);
      const response = await GET(request);
      
      expect(response.status).toBe(200);
    });
  });
});
