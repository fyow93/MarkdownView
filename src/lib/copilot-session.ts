/**
 * Copilot Session Service
 * Utilities for managing and reading Copilot CLI session files
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

// ============================================================================
// Types
// ============================================================================

export interface SessionMetadata {
  id: string;
  workingDirectory: string;
  createdAt: number;
  lastModified: number;
  fileCount: number;
}

export interface SessionFile {
  path: string;           // Full path
  relativePath: string;   // Path within session
  type: 'plan' | 'checkpoint' | 'file';
  name: string;
  size: number;
  lastModified: number;
  isNew: boolean;         // Modified within last 5 minutes
}

export interface WorkspaceYaml {
  workingDirectory?: string;
  createdAt?: string;
}

export interface ListSessionsOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'lastModified' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Constants
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NEW_FILE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Get the base path for Copilot session state
 * Respects XDG_CONFIG_HOME environment variable
 */
export function getSessionBasePath(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  
  if (xdgConfigHome) {
    return path.join(xdgConfigHome, 'copilot', 'session-state');
  }
  
  return path.join(os.homedir(), '.copilot', 'session-state');
}

/**
 * Validate that a session ID is a valid UUID format
 */
export function isValidSessionId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Check for path traversal attempts
  if (id.includes('..') || id.includes('/') || id.includes('\\')) {
    return false;
  }
  
  return UUID_REGEX.test(id);
}

/**
 * Validate that a path is within the session-state directory
 * Prevents directory traversal attacks
 */
export function isValidSessionPath(requestedPath: string): boolean {
  if (!requestedPath || typeof requestedPath !== 'string') {
    return false;
  }
  
  const basePath = getSessionBasePath();
  const resolvedPath = path.resolve(requestedPath);
  const resolvedBase = path.resolve(basePath);
  
  // Check if the resolved path starts with the base path
  // Also ensure it's not exactly the base path (should be inside a session)
  return resolvedPath.startsWith(resolvedBase + path.sep) || resolvedPath === resolvedBase;
}

// ============================================================================
// YAML Parsing
// ============================================================================

/**
 * Parse workspace.yaml content
 * Uses simple regex parsing to avoid adding yaml dependency
 */
export function parseWorkspaceYaml(content: string): WorkspaceYaml | null {
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return null;
  }
  
  try {
    const result: WorkspaceYaml = {};
    
    // Simple YAML parsing for known fields
    const workingDirMatch = content.match(/working_directory:\s*(.+?)(?:\n|$)/);
    if (workingDirMatch) {
      result.workingDirectory = workingDirMatch[1].trim();
    }
    
    const createdAtMatch = content.match(/created_at:\s*(.+?)(?:\n|$)/);
    if (createdAtMatch) {
      result.createdAt = createdAtMatch[1].trim();
    }
    
    // Return null if no valid fields found
    if (Object.keys(result).length === 0) {
      return null;
    }
    
    return result;
  } catch {
    return null;
  }
}

// ============================================================================
// Session Operations
// ============================================================================

/**
 * List all Copilot CLI sessions
 */
export async function listSessions(options: ListSessionsOptions = {}): Promise<SessionMetadata[]> {
  const {
    limit,
    offset = 0,
    sortBy = 'lastModified',
    sortOrder = 'desc',
  } = options;
  
  const basePath = getSessionBasePath();
  
  // Check if session-state directory exists
  if (!fs.existsSync(basePath)) {
    return [];
  }
  
  try {
    const entries = fs.readdirSync(basePath, { withFileTypes: true });
    
    // Filter to only valid session directories (UUID format)
    const sessionDirs = entries.filter(entry => 
      entry.isDirectory() && isValidSessionId(entry.name)
    );
    
    // Build session metadata
    const sessions: SessionMetadata[] = [];
    
    for (const dir of sessionDirs) {
      const sessionPath = path.join(basePath, dir.name);
      
      try {
        const stats = fs.statSync(sessionPath);
        
        // Try to read workspace.yaml for additional metadata
        let workingDirectory = '';
        const workspaceYamlPath = path.join(sessionPath, 'workspace.yaml');
        
        if (fs.existsSync(workspaceYamlPath)) {
          try {
            const yamlContent = fs.readFileSync(workspaceYamlPath, 'utf-8');
            const parsed = parseWorkspaceYaml(yamlContent);
            if (parsed?.workingDirectory) {
              workingDirectory = parsed.workingDirectory;
            }
          } catch {
            // Ignore read errors
          }
        }
        
        // Count markdown files in session
        let fileCount = 0;
        try {
          const sessionEntries = fs.readdirSync(sessionPath, { withFileTypes: true });
          fileCount = sessionEntries.filter(e => 
            e.isFile() && e.name.endsWith('.md')
          ).length;
          
          // Also count files in subdirectories
          for (const subEntry of sessionEntries) {
            if (subEntry.isDirectory() && (subEntry.name === 'checkpoints' || subEntry.name === 'files')) {
              const subPath = path.join(sessionPath, subEntry.name);
              const subEntries = fs.readdirSync(subPath, { withFileTypes: true });
              fileCount += subEntries.filter(e => 
                e.isFile() && e.name.endsWith('.md')
              ).length;
            }
          }
        } catch {
          // Ignore errors counting files
        }
        
        sessions.push({
          id: dir.name,
          workingDirectory,
          createdAt: stats.birthtime.getTime(),
          lastModified: stats.mtime.getTime(),
          fileCount,
        });
      } catch {
        // Skip sessions we can't stat
        continue;
      }
    }
    
    // Sort sessions
    sessions.sort((a, b) => {
      const aValue = sortBy === 'createdAt' ? a.createdAt : a.lastModified;
      const bValue = sortBy === 'createdAt' ? b.createdAt : b.lastModified;
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });
    
    // Apply pagination
    if (limit !== undefined) {
      return sessions.slice(offset, offset + limit);
    }
    
    return sessions.slice(offset);
  } catch {
    return [];
  }
}

/**
 * Get all markdown files in a session
 */
export async function getSessionFiles(sessionId: string): Promise<SessionFile[]> {
  if (!isValidSessionId(sessionId)) {
    return [];
  }
  
  const basePath = getSessionBasePath();
  const sessionPath = path.join(basePath, sessionId);
  
  if (!fs.existsSync(sessionPath)) {
    return [];
  }
  
  const files: SessionFile[] = [];
  const now = Date.now();
  
  try {
    const entries = fs.readdirSync(sessionPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(sessionPath, entry.name);
      
      if (entry.isFile() && entry.name.endsWith('.md')) {
        // Root level markdown files
        const stats = fs.statSync(fullPath);
        const type = entry.name === 'plan.md' ? 'plan' : 'file';
        
        files.push({
          path: fullPath,
          relativePath: entry.name,
          type,
          name: entry.name,
          size: stats.size,
          lastModified: stats.mtime.getTime(),
          isNew: (now - stats.mtime.getTime()) < NEW_FILE_THRESHOLD_MS,
        });
      } else if (entry.isDirectory()) {
        // Handle checkpoints and files directories
        const subType = entry.name === 'checkpoints' ? 'checkpoint' : 
                        entry.name === 'files' ? 'file' : null;
        
        if (subType) {
          try {
            const subEntries = fs.readdirSync(fullPath, { withFileTypes: true });
            
            for (const subEntry of subEntries) {
              if (subEntry.isFile() && subEntry.name.endsWith('.md')) {
                const subFullPath = path.join(fullPath, subEntry.name);
                const stats = fs.statSync(subFullPath);
                
                files.push({
                  path: subFullPath,
                  relativePath: path.join(entry.name, subEntry.name),
                  type: subType,
                  name: subEntry.name,
                  size: stats.size,
                  lastModified: stats.mtime.getTime(),
                  isNew: (now - stats.mtime.getTime()) < NEW_FILE_THRESHOLD_MS,
                });
              }
            }
          } catch {
            // Skip directories we can't read
          }
        }
      }
    }
    
    // Sort by lastModified descending
    files.sort((a, b) => b.lastModified - a.lastModified);
    
    return files;
  } catch {
    return [];
  }
}

/**
 * Read content of a session file
 */
export async function readSessionFile(sessionId: string, relativePath: string): Promise<string | null> {
  if (!isValidSessionId(sessionId)) {
    return null;
  }
  
  // Prevent path traversal
  if (relativePath.includes('..')) {
    return null;
  }
  
  const basePath = getSessionBasePath();
  const filePath = path.join(basePath, sessionId, relativePath);
  
  // Validate the path is within session directory
  if (!isValidSessionPath(filePath)) {
    return null;
  }
  
  // Only allow markdown files
  if (!filePath.endsWith('.md')) {
    return null;
  }
  
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Get session details by ID
 */
export async function getSession(sessionId: string): Promise<SessionMetadata | null> {
  if (!isValidSessionId(sessionId)) {
    return null;
  }
  
  const basePath = getSessionBasePath();
  const sessionPath = path.join(basePath, sessionId);
  
  if (!fs.existsSync(sessionPath)) {
    return null;
  }
  
  try {
    const stats = fs.statSync(sessionPath);
    
    if (!stats.isDirectory()) {
      return null;
    }
    
    // Read workspace.yaml
    let workingDirectory = '';
    const workspaceYamlPath = path.join(sessionPath, 'workspace.yaml');
    
    if (fs.existsSync(workspaceYamlPath)) {
      try {
        const yamlContent = fs.readFileSync(workspaceYamlPath, 'utf-8');
        const parsed = parseWorkspaceYaml(yamlContent);
        if (parsed?.workingDirectory) {
          workingDirectory = parsed.workingDirectory;
        }
      } catch {
        // Ignore read errors
      }
    }
    
    // Count files
    const files = await getSessionFiles(sessionId);
    
    return {
      id: sessionId,
      workingDirectory,
      createdAt: stats.birthtime.getTime(),
      lastModified: stats.mtime.getTime(),
      fileCount: files.length,
    };
  } catch {
    return null;
  }
}
