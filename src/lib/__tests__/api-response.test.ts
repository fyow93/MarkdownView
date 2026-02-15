import { describe, expect, it } from 'vitest';
import {
  isCopilotSessionsResponse,
  normalizeFileApiResponse,
  type CopilotSessionsApiResponse,
  type FileApiResponse,
  type RegularFileApiResponse,
} from '../api-response';

describe('api-response utilities', () => {
  describe('isCopilotSessionsResponse', () => {
    it('should return true for copilot sessions API response', () => {
      const response: CopilotSessionsApiResponse = {
        success: true,
        data: {
          sessionId: 'test-session-id',
          relativePath: 'checkpoints/index.md',
          content: '# Test Content',
        },
      };

      expect(isCopilotSessionsResponse(response)).toBe(true);
    });

    it('should return false for regular file API response', () => {
      const response: RegularFileApiResponse = {
        content: '# Test Content',
        lastModified: '2024-01-15T10:30:00Z',
        size: 1234,
      };

      expect(isCopilotSessionsResponse(response)).toBe(false);
    });

    it('should return false for response without success property', () => {
      const response = {
        data: {
          content: '# Test',
        },
      } as FileApiResponse;

      expect(isCopilotSessionsResponse(response)).toBe(false);
    });

    it('should return false for response with success but no data', () => {
      const response = {
        success: true,
      } as FileApiResponse;

      expect(isCopilotSessionsResponse(response)).toBe(false);
    });

    it('should return false for response with data but no content in data', () => {
      const response = {
        success: true,
        data: {
          sessionId: 'test',
          relativePath: 'test.md',
        },
      } as FileApiResponse;

      expect(isCopilotSessionsResponse(response)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isCopilotSessionsResponse(null as unknown as FileApiResponse)).toBe(false);
    });
  });

  describe('normalizeFileApiResponse', () => {
    it('should normalize copilot sessions API response', () => {
      const response: CopilotSessionsApiResponse = {
        success: true,
        data: {
          sessionId: 'ffafd583-7cbf-45e9-b000-edae2dd9ad74',
          relativePath: 'checkpoints/index.md',
          content: '# Copilot Session Content\n\nThis is a test.',
        },
      };

      const normalized = normalizeFileApiResponse(response);

      expect(normalized).toEqual({
        content: '# Copilot Session Content\n\nThis is a test.',
        lastModified: undefined,
        size: undefined,
      });
    });

    it('should normalize regular file API response', () => {
      const response: RegularFileApiResponse = {
        content: '# Regular File Content',
        lastModified: '2024-01-15T10:30:00Z',
        size: 500,
      };

      const normalized = normalizeFileApiResponse(response);

      expect(normalized).toEqual({
        content: '# Regular File Content',
        lastModified: '2024-01-15T10:30:00Z',
        size: 500,
      });
    });

    it('should handle regular file response without optional fields', () => {
      const response: RegularFileApiResponse = {
        content: '# Minimal Content',
      };

      const normalized = normalizeFileApiResponse(response);

      expect(normalized).toEqual({
        content: '# Minimal Content',
        lastModified: undefined,
        size: undefined,
      });
    });

    it('should preserve empty string content from copilot sessions', () => {
      const response: CopilotSessionsApiResponse = {
        success: true,
        data: {
          sessionId: 'test-id',
          relativePath: 'empty.md',
          content: '',
        },
      };

      const normalized = normalizeFileApiResponse(response);

      expect(normalized.content).toBe('');
    });

    it('should preserve empty string content from regular file', () => {
      const response: RegularFileApiResponse = {
        content: '',
        lastModified: '2024-01-15T10:30:00Z',
      };

      const normalized = normalizeFileApiResponse(response);

      expect(normalized.content).toBe('');
    });
  });
});
