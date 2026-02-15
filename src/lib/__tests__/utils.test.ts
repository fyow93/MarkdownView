/**
 * Tests for encodeFilePath and buildFileApiUrl utility functions
 */

import { describe, it, expect } from 'vitest';
import { encodeFilePath, buildFileApiUrl } from '../utils';

describe('encodeFilePath', () => {
  it('should return empty string for empty input', () => {
    expect(encodeFilePath('')).toBe('');
  });

  it('should preserve simple paths without special characters', () => {
    expect(encodeFilePath('docs/README.md')).toBe('docs/README.md');
  });

  it('should preserve single file without directory', () => {
    expect(encodeFilePath('example.md')).toBe('example.md');
  });

  it('should preserve deep paths', () => {
    expect(encodeFilePath('docs/api/v1/reference.md')).toBe('docs/api/v1/reference.md');
  });

  it('should encode Chinese characters in path segments', () => {
    const result = encodeFilePath('文档/说明.md');
    expect(result).toBe('%E6%96%87%E6%A1%A3/%E8%AF%B4%E6%98%8E.md');
  });

  it('should encode spaces in filenames', () => {
    const result = encodeFilePath('docs/my file.md');
    expect(result).toBe('docs/my%20file.md');
  });

  it('should encode special characters but preserve slashes', () => {
    const result = encodeFilePath('docs/file#1.md');
    expect(result).toBe('docs/file%231.md');
  });

  it('should handle multiple levels with special characters', () => {
    const result = encodeFilePath('文档/子目录/说明 文件.md');
    expect(result).toBe('%E6%96%87%E6%A1%A3/%E5%AD%90%E7%9B%AE%E5%BD%95/%E8%AF%B4%E6%98%8E%20%E6%96%87%E4%BB%B6.md');
  });
});

describe('buildFileApiUrl', () => {
  it('should return empty string for empty input', () => {
    expect(buildFileApiUrl('')).toBe('');
  });

  it('should prepend /api/file/ for regular file paths', () => {
    expect(buildFileApiUrl('docs/README.md')).toBe('/api/file/docs/README.md');
  });

  it('should not double-prepend for paths already starting with /api/', () => {
    const sessionPath = '/api/copilot-sessions/file/session-123/checkpoints/index.md';
    expect(buildFileApiUrl(sessionPath)).toBe(sessionPath);
  });

  it('should handle api/ without leading slash (treat as regular path)', () => {
    expect(buildFileApiUrl('api/docs/README.md')).toBe('/api/file/api/docs/README.md');
  });

  it('should encode Chinese characters in regular paths', () => {
    expect(buildFileApiUrl('文档/说明.md')).toBe('/api/file/%E6%96%87%E6%A1%A3/%E8%AF%B4%E6%98%8E.md');
  });

  it('should preserve encoded paths that already start with /api/', () => {
    const encodedPath = '/api/copilot-sessions/file/abc-123/%E6%96%87%E6%A1%A3/test.md';
    expect(buildFileApiUrl(encodedPath)).toBe(encodedPath);
  });
});
