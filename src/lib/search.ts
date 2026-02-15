import fs from 'fs/promises';
import path from 'path';
import { getSessionBasePath, isValidSessionId } from './copilot-session';
import { logger } from './logger';

export interface SearchMatch {
  line: number;
  preview: string;
  context: string;
}

export interface SearchResult {
  sessionId: string;
  file: {
    path: string;
    relativePath: string;
    name: string;
    type: 'plan' | 'checkpoint' | 'file';
  };
  matches: SearchMatch[];
}

const MAX_PREVIEW_LENGTH = 60;
const MAX_MATCHES_PER_FILE = 5;
const MAX_TOTAL_RESULTS = 50;

/**
 * Identify file type and relative path
 */
function parseFileInfo(fullPath: string, sessionPath: string): { relativePath: string; type: 'plan' | 'checkpoint' | 'file'; name: string } | null {
  const relative = path.relative(sessionPath, fullPath);
  const parts = relative.split(path.sep);
  const fileName = parts[parts.length - 1];

  if (!fileName.endsWith('.md')) return null;

  let type: 'plan' | 'checkpoint' | 'file' = 'file';

  if (fileName === 'plan.md' && parts.length === 1) {
    type = 'plan';
  } else if (parts[0] === 'checkpoints') {
    type = 'checkpoint';
  } else if (parts[0] === 'files') {
    type = 'file';
  } else {
    // Other root markdown files? treat as file
    type = 'file';
  }

  return {
    relativePath: relative,
    type,
    name: fileName
  };
}

/**
 * Scan directory recursively for markdown files
 */
async function getMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await getMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch {
    // Ignore access errors or missing dirs
  }
  return files;
}

/**
 * extract matches from content
 */
function findMatches(content: string, query: string): SearchMatch[] {
  const matches: SearchMatch[] = [];
  const lines = content.split('\n');
  const lowerQuery = query.toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    const index = lowerLine.indexOf(lowerQuery);

    if (index !== -1) {
      // Create preview
      const start = Math.max(0, index - MAX_PREVIEW_LENGTH / 2);
      const end = Math.min(line.length, index + query.length + MAX_PREVIEW_LENGTH / 2);
      let preview = line.substring(start, end);
      
      if (start > 0) preview = '...' + preview;
      if (end < line.length) preview = preview + '...';

      matches.push({
        line: i + 1, // 1-based
        preview,
        context: line.trim() // full line as context
      });

      if (matches.length >= MAX_MATCHES_PER_FILE) break;
    }
  }

  return matches;
}

/**
 * Check if filename matches the query
 */
function filenameMatches(fileName: string, query: string): boolean {
  const lowerFileName = fileName.toLowerCase();
  const lowerQuery = query.toLowerCase();
  return lowerFileName.includes(lowerQuery);
}

/**
 * Search across sessions
 */
export async function searchSessions(query: string, targetSessionId?: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const results: SearchResult[] = [];
  const basePath = getSessionBasePath();
  
  try {
    let sessionIds: string[] = [];
    
    if (targetSessionId) {
      if (isValidSessionId(targetSessionId)) {
        sessionIds = [targetSessionId];
      }
    } else {
      // List all sessions
      const entries = await fs.readdir(basePath, { withFileTypes: true });
      sessionIds = entries
        .filter(e => e.isDirectory() && isValidSessionId(e.name))
        .map(e => e.name);
    }

    let totalMatches = 0;

    for (const sessionId of sessionIds) {
      if (totalMatches >= MAX_TOTAL_RESULTS) break;

      const sessionPath = path.join(basePath, sessionId);
      const files = await getMarkdownFiles(sessionPath);
      
      for (const file of files) {
        if (totalMatches >= MAX_TOTAL_RESULTS) break;

        const fileInfo = parseFileInfo(file, sessionPath);
        if (!fileInfo) continue;

        try {
          const content = await fs.readFile(file, 'utf-8');
          const contentMatches = findMatches(content, query);
          
          // Also check if filename matches
          const fileNameMatch = filenameMatches(fileInfo.name, query);

          if (contentMatches.length > 0 || fileNameMatch) {
            // If filename matches but no content matches, add a filename match indicator
            const matches = contentMatches.length > 0 
              ? contentMatches 
              : [{ line: 0, preview: `📄 Filename match: ${fileInfo.name}`, context: fileInfo.name }];
            
            results.push({
              sessionId,
              file: {
                path: file,
                relativePath: fileInfo.relativePath,
                name: fileInfo.name,
                type: fileInfo.type
              },
              matches
            });
            totalMatches++;
          }
        } catch (err) {
          logger.warn(`Failed to read file for search: ${file}`, err);
        }
      }
    }
  } catch (error) {
    logger.error('Search operation failed', error);
    throw error;
  }

  return results;
}
