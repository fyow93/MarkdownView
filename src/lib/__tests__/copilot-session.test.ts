/**
 * Tests for CopilotSessionService - Session management utilities
 * Following TDD: Write tests first, then implement
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file requires flexible typing for mocks and type assertions

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import os from 'os';

// Mock fs module with proper default export
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(),
      readdirSync: vi.fn(),
      readFileSync: vi.fn(),
      statSync: vi.fn(),
      accessSync: vi.fn(),
      constants: { R_OK: 4 },
    },
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
    statSync: vi.fn(),
    accessSync: vi.fn(),
    constants: { R_OK: 4 },
  };
});

// Import after mocking
import fs from 'fs';
import {
  isValidSessionId,
  isValidSessionPath,
  getSessionBasePath,
  parseWorkspaceYaml,
  listSessions,
  getSessionFiles,
} from '../copilot-session';

describe('CopilotSessionService', () => {
  const mockSessionPath = path.join(os.homedir(), '.copilot', 'session-state');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidSessionId', () => {
    it('should return true for valid UUID format', () => {
      expect(isValidSessionId('01520805-ffe6-4de5-b084-f31da30f1691')).toBe(true);
    });

    it('should return true for uppercase UUID', () => {
      expect(isValidSessionId('01520805-FFE6-4DE5-B084-F31DA30F1691')).toBe(true);
    });

    it('should return false for invalid UUID format', () => {
      expect(isValidSessionId('not-a-uuid')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidSessionId('')).toBe(false);
    });

    it('should return false for UUID without dashes', () => {
      expect(isValidSessionId('01520805ffe64de5b084f31da30f1691')).toBe(false);
    });

    it('should return false for path traversal attempts', () => {
      expect(isValidSessionId('../../../etc/passwd')).toBe(false);
    });
  });

  describe('isValidSessionPath', () => {
    it('should return true for path within session-state directory', () => {
      const validPath = path.join(mockSessionPath, '01520805-ffe6-4de5-b084-f31da30f1691', 'plan.md');
      expect(isValidSessionPath(validPath)).toBe(true);
    });

    it('should return false for path outside session-state directory', () => {
      expect(isValidSessionPath('/etc/passwd')).toBe(false);
    });

    it('should return false for path with directory traversal', () => {
      const maliciousPath = path.join(mockSessionPath, '..', '..', 'etc', 'passwd');
      expect(isValidSessionPath(maliciousPath)).toBe(false);
    });

    it('should return false for empty path', () => {
      expect(isValidSessionPath('')).toBe(false);
    });

    it('should return true for paths with unicode characters', () => {
      const unicodePath = path.join(mockSessionPath, '01520805-ffe6-4de5-b084-f31da30f1691', '文档.md');
      expect(isValidSessionPath(unicodePath)).toBe(true);
    });
  });

  describe('getSessionBasePath', () => {
    it('should return default path under ~/.copilot/session-state', () => {
      const basePath = getSessionBasePath();
      expect(basePath).toBe(path.join(os.homedir(), '.copilot', 'session-state'));
    });

    it('should respect XDG_CONFIG_HOME if set', () => {
      const originalEnv = process.env.XDG_CONFIG_HOME;
      try {
        process.env.XDG_CONFIG_HOME = '/custom/config';
        
        const basePath = getSessionBasePath();
        expect(basePath).toBe(path.join('/custom/config', 'copilot', 'session-state'));
      } finally {
        // Always restore environment, even if test fails
        if (originalEnv !== undefined) {
          process.env.XDG_CONFIG_HOME = originalEnv;
        } else {
          delete process.env.XDG_CONFIG_HOME;
        }
      }
    });
  });

  describe('parseWorkspaceYaml', () => {
    it('should parse valid workspace.yaml content', () => {
      const yamlContent = `
working_directory: /home/user/project
created_at: 2026-01-25T10:00:00Z
`;
      const result = parseWorkspaceYaml(yamlContent);
      expect(result).toEqual({
        workingDirectory: '/home/user/project',
        createdAt: '2026-01-25T10:00:00Z',
      });
    });

    it('should return null for invalid YAML', () => {
      const invalidYaml = 'invalid: yaml: content:';
      const result = parseWorkspaceYaml(invalidYaml);
      expect(result).toBeNull();
    });

    it('should return null for empty content', () => {
      const result = parseWorkspaceYaml('');
      expect(result).toBeNull();
    });

    it('should handle missing fields gracefully', () => {
      const yamlContent = 'working_directory: /home/user/project';
      const result = parseWorkspaceYaml(yamlContent);
      expect(result?.workingDirectory).toBe('/home/user/project');
      expect(result?.createdAt).toBeUndefined();
    });
  });

  describe('listSessions', () => {
    it('should return empty array when session-state directory does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const sessions = await listSessions();
      expect(sessions).toEqual([]);
    });

    it('should return list of sessions with metadata', async () => {
      const sessionId = '01520805-ffe6-4de5-b084-f31da30f1691';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: sessionId, isDirectory: () => true } as any,
      ]);
      vi.mocked(fs.statSync).mockReturnValue({
        isDirectory: () => true,
        mtime: new Date('2026-01-25T10:00:00Z'),
        birthtime: new Date('2026-01-25T09:00:00Z'),
      } as any);
      vi.mocked(fs.readFileSync).mockReturnValue('working_directory: /home/user/project');
      
      const sessions = await listSessions();
      
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(sessionId);
      expect(sessions[0].workingDirectory).toBe('/home/user/project');
    });

    it('should filter out non-UUID directories', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'not-a-uuid', isDirectory: () => true } as any,
        { name: '01520805-ffe6-4de5-b084-f31da30f1691', isDirectory: () => true } as any,
      ]);
      vi.mocked(fs.statSync).mockReturnValue({
        isDirectory: () => true,
        mtime: new Date(),
        birthtime: new Date(),
      } as any);
      vi.mocked(fs.readFileSync).mockReturnValue('');
      
      const sessions = await listSessions();
      
      expect(sessions).toHaveLength(1);
    });

    it('should sort sessions by lastModified descending', async () => {
      const session1 = '11111111-1111-1111-1111-111111111111';
      const session2 = '22222222-2222-2222-2222-222222222222';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: session1, isDirectory: () => true } as any,
        { name: session2, isDirectory: () => true } as any,
      ]);
      
      // session1 is older, session2 is newer
      vi.mocked(fs.statSync).mockImplementation((p: any) => {
        const path = p as string;
        if (path.includes(session1)) {
          return { isDirectory: () => true, mtime: new Date('2026-01-24'), birthtime: new Date('2026-01-24') } as any;
        }
        return { isDirectory: () => true, mtime: new Date('2026-01-25'), birthtime: new Date('2026-01-25') } as any;
      });
      vi.mocked(fs.readFileSync).mockReturnValue('');
      
      const sessions = await listSessions();
      
      // Newest first
      expect(sessions[0].id).toBe(session2);
      expect(sessions[1].id).toBe(session1);
    });

    it('should handle pagination with limit and offset', async () => {
      const sessions = Array.from({ length: 10 }, (_, i) => 
        `${i}${i}${i}${i}${i}${i}${i}${i}-${i}${i}${i}${i}-${i}${i}${i}${i}-${i}${i}${i}${i}-${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}`
      );
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(
        sessions.map(s => ({ name: s, isDirectory: () => true } as any))
      );
      vi.mocked(fs.statSync).mockReturnValue({
        isDirectory: () => true,
        mtime: new Date(),
        birthtime: new Date(),
      } as any);
      vi.mocked(fs.readFileSync).mockReturnValue('');
      
      const result = await listSessions({ limit: 3, offset: 2 });
      
      expect(result).toHaveLength(3);
    });
  });

  describe('getSessionFiles', () => {
    const sessionId = '01520805-ffe6-4de5-b084-f31da30f1691';

    it('should return empty array for non-existent session', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const files = await getSessionFiles(sessionId);
      expect(files).toEqual([]);
    });

    it('should return plan.md as type "plan"', async () => {
      const sessionPath = path.join(mockSessionPath, sessionId);
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockImplementation((p: any) => {
        const dirPath = p as string;
        if (dirPath === sessionPath) {
          return [
            { name: 'plan.md', isDirectory: () => false, isFile: () => true } as any,
          ];
        }
        return [];
      });
      vi.mocked(fs.statSync).mockReturnValue({
        size: 1024,
        mtime: new Date('2026-01-25T10:00:00Z'),
      } as any);
      
      const files = await getSessionFiles(sessionId);
      
      expect(files).toHaveLength(1);
      expect(files[0].type).toBe('plan');
      expect(files[0].name).toBe('plan.md');
    });

    it('should return checkpoint files with type "checkpoint"', async () => {
      const sessionPath = path.join(mockSessionPath, sessionId);
      const checkpointsPath = path.join(sessionPath, 'checkpoints');
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockImplementation((p: any) => {
        const dirPath = p as string;
        if (dirPath === sessionPath) {
          return [
            { name: 'checkpoints', isDirectory: () => true, isFile: () => false } as any,
          ];
        }
        if (dirPath === checkpointsPath) {
          return [
            { name: 'index.md', isDirectory: () => false, isFile: () => true } as any,
            { name: '001-feature.md', isDirectory: () => false, isFile: () => true } as any,
          ];
        }
        return [];
      });
      vi.mocked(fs.statSync).mockReturnValue({
        size: 512,
        mtime: new Date('2026-01-25T11:00:00Z'),
      } as any);
      
      const files = await getSessionFiles(sessionId);
      
      const checkpointFiles = files.filter(f => f.type === 'checkpoint');
      expect(checkpointFiles).toHaveLength(2);
    });

    it('should return files from files/ directory with type "file"', async () => {
      const sessionPath = path.join(mockSessionPath, sessionId);
      const filesPath = path.join(sessionPath, 'files');
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockImplementation((p: any) => {
        const dirPath = p as string;
        if (dirPath === sessionPath) {
          return [
            { name: 'files', isDirectory: () => true, isFile: () => false } as any,
          ];
        }
        if (dirPath === filesPath) {
          return [
            { name: 'generated-doc.md', isDirectory: () => false, isFile: () => true } as any,
          ];
        }
        return [];
      });
      vi.mocked(fs.statSync).mockReturnValue({
        size: 2048,
        mtime: new Date('2026-01-25T12:00:00Z'),
      } as any);
      
      const files = await getSessionFiles(sessionId);
      
      const generatedFiles = files.filter(f => f.type === 'file');
      expect(generatedFiles).toHaveLength(1);
      expect(generatedFiles[0].name).toBe('generated-doc.md');
    });

    it('should only include .md files', async () => {
      const sessionPath = path.join(mockSessionPath, sessionId);
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockImplementation((p: any) => {
        const dirPath = p as string;
        if (dirPath === sessionPath) {
          return [
            { name: 'plan.md', isDirectory: () => false, isFile: () => true } as any,
            { name: 'events.jsonl', isDirectory: () => false, isFile: () => true } as any,
            { name: 'workspace.yaml', isDirectory: () => false, isFile: () => true } as any,
          ];
        }
        return [];
      });
      vi.mocked(fs.statSync).mockReturnValue({
        size: 1024,
        mtime: new Date(),
      } as any);
      
      const files = await getSessionFiles(sessionId);
      
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('plan.md');
    });

    it('should mark files as "isNew" if modified within 5 minutes', async () => {
      const sessionPath = path.join(mockSessionPath, sessionId);
      const now = new Date();
      const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockImplementation((p: any) => {
        const dirPath = p as string;
        if (dirPath === sessionPath) {
          return [
            { name: 'new-file.md', isDirectory: () => false, isFile: () => true } as any,
            { name: 'old-file.md', isDirectory: () => false, isFile: () => true } as any,
          ];
        }
        return [];
      });
      vi.mocked(fs.statSync).mockImplementation((p: any) => {
        const filePath = p as string;
        if (filePath.includes('new-file.md')) {
          return { size: 1024, mtime: threeMinutesAgo } as any;
        }
        return { size: 1024, mtime: tenMinutesAgo } as any;
      });
      
      const files = await getSessionFiles(sessionId);
      
      const newFile = files.find(f => f.name === 'new-file.md');
      const oldFile = files.find(f => f.name === 'old-file.md');
      
      expect(newFile?.isNew).toBe(true);
      expect(oldFile?.isNew).toBe(false);
    });
  });
});
