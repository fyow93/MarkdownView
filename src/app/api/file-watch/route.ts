/**
 * API Route: Watch File Changes (SSE)
 * GET /api/file-watch?path=<filePath>
 * 
 * Server-Sent Events endpoint for real-time file change notifications.
 * This enables hot reload functionality without requiring a separate
 * Socket.IO server during development.
 * 
 * Features:
 * - Uses chokidar for efficient file watching
 * - Debounces rapid file changes
 * - Security: only allows .md files within PROJECT_ROOT
 * - Automatic cleanup on client disconnect
 */

import { NextRequest, NextResponse } from 'next/server';
import chokidar, { type FSWatcher } from 'chokidar';
import fs from 'fs';
import path from 'path';
import config from '../../../../config.js';
import { logger } from '@/lib/logger';

// Event types
interface FileWatchEvent {
  type: 'file:changed' | 'file:deleted' | 'connected' | 'error';
  timestamp: number;
  data: {
    filePath?: string;
    lastModified?: string;
    message?: string;
  };
}

// Active watchers (keyed by client ID)
const activeWatchers = new Map<string, FSWatcher>();

// Debounce map to prevent rapid-fire events
const debounceMap = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_MS = 300;

/**
 * Create SSE event string
 */
function createEvent(event: FileWatchEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Security check - prevent directory traversal attacks
 */
function isValidPath(requestedPath: string, projectRoot: string): boolean {
  const resolvedPath = path.resolve(projectRoot, requestedPath);
  return resolvedPath.startsWith(projectRoot);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get('path');
  
  // Validate path parameter
  if (!filePath) {
    return NextResponse.json(
      { error: '缺少必需的path参数' },
      { status: 400 }
    );
  }
  
  // Only allow markdown files
  if (!filePath.endsWith('.md')) {
    return NextResponse.json(
      { error: '只允许监控Markdown文件 (.md)' },
      { status: 400 }
    );
  }
  
  const PROJECT_ROOT = config.PROJECT_ROOT;
  
  // Security check
  if (!isValidPath(filePath, PROJECT_ROOT)) {
    return NextResponse.json(
      { error: '访问被拒绝：无效的文件路径' },
      { status: 403 }
    );
  }
  
  const fullPath = path.join(PROJECT_ROOT, filePath);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    return NextResponse.json(
      { error: '文件未找到' },
      { status: 404 }
    );
  }
  
  const clientId = crypto.randomUUID();
  
  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      logger.debug(`File watch SSE client connected: ${clientId}, watching: ${filePath}`);
      
      // Get initial file stats
      let lastModified: string;
      try {
        const stats = fs.statSync(fullPath);
        lastModified = stats.mtime.toISOString();
      } catch {
        lastModified = new Date().toISOString();
      }
      
      // Send initial connected event
      const connectedEvent: FileWatchEvent = {
        type: 'connected',
        timestamp: Date.now(),
        data: {
          filePath,
          lastModified,
        },
      };
      controller.enqueue(new TextEncoder().encode(createEvent(connectedEvent)));
      
      // Create file watcher
      const watcher = chokidar.watch(fullPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50,
        },
      });
      
      activeWatchers.set(clientId, watcher);
      
      // Handle file change
      watcher.on('change', (changedPath: string) => {
        // Debounce to prevent rapid-fire events
        const debounceKey = `${clientId}:${changedPath}`;
        
        if (debounceMap.has(debounceKey)) {
          clearTimeout(debounceMap.get(debounceKey));
        }
        
        debounceMap.set(debounceKey, setTimeout(() => {
          debounceMap.delete(debounceKey);
          
          try {
            const stats = fs.statSync(changedPath);
            const event: FileWatchEvent = {
              type: 'file:changed',
              timestamp: Date.now(),
              data: {
                filePath,
                lastModified: stats.mtime.toISOString(),
              },
            };
            controller.enqueue(new TextEncoder().encode(createEvent(event)));
            logger.debug(`File changed: ${filePath}`);
          } catch (err) {
            logger.error('Error reading file stats:', err);
          }
        }, DEBOUNCE_MS));
      });
      
      // Handle file deletion
      watcher.on('unlink', () => {
        const event: FileWatchEvent = {
          type: 'file:deleted',
          timestamp: Date.now(),
          data: {
            filePath,
          },
        };
        controller.enqueue(new TextEncoder().encode(createEvent(event)));
        logger.debug(`File deleted: ${filePath}`);
      });
      
      // Handle watcher errors
      watcher.on('error', (error: unknown) => {
        logger.error('File watcher error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown watcher error';
        const event: FileWatchEvent = {
          type: 'error',
          timestamp: Date.now(),
          data: {
            message: errorMessage,
          },
        };
        controller.enqueue(new TextEncoder().encode(createEvent(event)));
      });
    },
    
    cancel() {
      // Cleanup on client disconnect
      const watcher = activeWatchers.get(clientId);
      if (watcher) {
        watcher.close();
        activeWatchers.delete(clientId);
        logger.debug(`File watch SSE client disconnected: ${clientId}`);
      }
      
      // Clear any pending debounce timers for this client
      for (const [key, timeout] of debounceMap.entries()) {
        if (key.startsWith(`${clientId}:`)) {
          clearTimeout(timeout);
          debounceMap.delete(key);
        }
      }
    },
  });
  
  // Handle abort signal for cleanup
  request.signal.addEventListener('abort', () => {
    const watcher = activeWatchers.get(clientId);
    if (watcher) {
      watcher.close();
      activeWatchers.delete(clientId);
    }
  });
  
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
