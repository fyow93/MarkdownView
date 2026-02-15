/**
 * API Route: Watch Session Changes (SSE)
 * GET /api/copilot-sessions/watch
 * 
 * Server-Sent Events endpoint for real-time session updates
 * 
 * NOTE: Module-level Maps are used for watcher management.
 * In serverless environments, these may not persist across cold starts.
 * Cleanup is handled via:
 * 1. AbortSignal listener for client disconnect
 * 2. Stream cancel() callback
 * 3. Error handler that closes watcher on failure
 * 
 * For production serverless deployments, consider external WebSocket service.
 */

import { NextRequest } from 'next/server';
import chokidar, { type FSWatcher } from 'chokidar';
import path from 'path';
import { getSessionBasePath, isValidSessionId } from '@/lib/copilot-session';
import { logger } from '@/lib/logger';

// Event types
interface SessionEvent {
  type: 'session:created' | 'session:updated' | 'file:created' | 'file:updated' | 'file:deleted' | 'connected';
  timestamp: number;
  data: {
    sessionId?: string;
    filePath?: string;
    fileType?: 'plan' | 'checkpoint' | 'file';
  };
}

// Keep track of active watchers
const activeWatchers = new Map<string, FSWatcher>();

// Debounce map to prevent rapid-fire events
const debounceMap = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_MS = 300;

function createEvent(event: SessionEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function parseSessionPath(filePath: string, basePath: string): { sessionId: string; relativePath: string; fileType: 'plan' | 'checkpoint' | 'file' } | null {
  const relative = path.relative(basePath, filePath);
  const parts = relative.split(path.sep);
  
  if (parts.length < 2) {
    return null;
  }
  
  const sessionId = parts[0];
  
  if (!isValidSessionId(sessionId)) {
    return null;
  }
  
  const fileName = parts[parts.length - 1];
  
  // Only track markdown files
  if (!fileName.endsWith('.md')) {
    return null;
  }
  
  let fileType: 'plan' | 'checkpoint' | 'file' = 'file';
  
  if (fileName === 'plan.md' && parts.length === 2) {
    fileType = 'plan';
  } else if (parts[1] === 'checkpoints') {
    fileType = 'checkpoint';
  } else if (parts[1] === 'files') {
    fileType = 'file';
  }
  
  return {
    sessionId,
    relativePath: parts.slice(1).join('/'),
    fileType,
  };
}

export async function GET(request: NextRequest) {
  const basePath = getSessionBasePath();
  const clientId = crypto.randomUUID();
  
  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      logger.info(`SSE client connected: ${clientId}`);
      
      // Send initial connected event
      const connectedEvent: SessionEvent = {
        type: 'connected',
        timestamp: Date.now(),
        data: {},
      };
      controller.enqueue(new TextEncoder().encode(createEvent(connectedEvent)));
      
      // Create file watcher
      const watcher = chokidar.watch(basePath, {
        ignored: [
          /(^|[/\\])\../,  // Ignore dotfiles
          /events\.jsonl$/,
          /workspace\.yaml$/,
        ],
        persistent: true,
        ignoreInitial: true,
        depth: 3,  // Only watch up to 3 levels deep
      });
      
      activeWatchers.set(clientId, watcher);
      
      const sendEvent = (eventType: SessionEvent['type'], filePath: string) => {
        const parsed = parseSessionPath(filePath, basePath);
        
        if (!parsed) {
          return;
        }
        
        // Debounce events for the same file
        const debounceKey = `${parsed.sessionId}:${parsed.relativePath}`;
        
        if (debounceMap.has(debounceKey)) {
          clearTimeout(debounceMap.get(debounceKey));
        }
        
        debounceMap.set(debounceKey, setTimeout(() => {
          debounceMap.delete(debounceKey);
          
          const event: SessionEvent = {
            type: eventType,
            timestamp: Date.now(),
            data: {
              sessionId: parsed.sessionId,
              filePath: parsed.relativePath,
              fileType: parsed.fileType,
            },
          };
          
          try {
            controller.enqueue(new TextEncoder().encode(createEvent(event)));
          } catch {
            // Client disconnected
            cleanup();
          }
        }, DEBOUNCE_MS));
      };
      
      watcher.on('add', (filePath) => {
        sendEvent('file:created', filePath);
      });
      
      watcher.on('change', (filePath) => {
        sendEvent('file:updated', filePath);
      });
      
      watcher.on('unlink', (filePath) => {
        sendEvent('file:deleted', filePath);
      });
      
      watcher.on('addDir', (dirPath) => {
        // Check if a new session directory was created
        const relative = path.relative(basePath, dirPath);
        const parts = relative.split(path.sep);
        
        if (parts.length === 1 && isValidSessionId(parts[0])) {
          const event: SessionEvent = {
            type: 'session:created',
            timestamp: Date.now(),
            data: {
              sessionId: parts[0],
            },
          };
          
          try {
            controller.enqueue(new TextEncoder().encode(createEvent(event)));
          } catch {
            cleanup();
          }
        }
      });
      
      watcher.on('error', (error) => {
        logger.error('Watcher error', error);
      });
      
      // Cleanup function
      const cleanup = () => {
        logger.info(`SSE client disconnected: ${clientId}`);
        
        if (activeWatchers.has(clientId)) {
          const w = activeWatchers.get(clientId);
          if (w) {
            w.close();
          }
          activeWatchers.delete(clientId);
        }
        
        // Clear any pending debounced events
        debounceMap.forEach((timeout, key) => {
          clearTimeout(timeout);
          debounceMap.delete(key);
        });
      };
      
      // Handle client disconnect via AbortSignal
      request.signal.addEventListener('abort', cleanup);
    },
    
    cancel() {
      // Cleanup when stream is cancelled
      if (activeWatchers.has(clientId)) {
        const w = activeWatchers.get(clientId);
        if (w) {
          w.close();
        }
        activeWatchers.delete(clientId);
      }
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',  // Disable nginx buffering
    },
  });
}
