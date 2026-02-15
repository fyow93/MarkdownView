/**
 * API Route: Read Session File Content
 * GET /api/copilot-sessions/file/[...path]
 * 
 * Reads markdown file content from a session
 * Path format: /api/copilot-sessions/file/{sessionId}/{relativePath}
 */

import { NextRequest, NextResponse } from 'next/server';
import { readSessionFile, isValidSessionId } from '@/lib/copilot-session';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{
    path: string[];
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { path: pathParts } = await params;
    
    // Path should be: [sessionId, ...relativePath]
    if (!pathParts || pathParts.length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid path format. Expected: /file/{sessionId}/{relativePath}',
          code: 'INVALID_PATH',
        },
        { status: 400 }
      );
    }
    
    const [sessionId, ...filePathParts] = pathParts;
    const relativePath = filePathParts.join('/');
    
    // Validate session ID format
    if (!isValidSessionId(sessionId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid session ID format',
          code: 'INVALID_SESSION_ID',
        },
        { status: 400 }
      );
    }
    
    // Validate file extension
    if (!relativePath.endsWith('.md')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Only markdown files are allowed',
          code: 'INVALID_FILE_TYPE',
        },
        { status: 400 }
      );
    }
    
    const content = await readSessionFile(sessionId, relativePath);
    
    if (content === null) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File not found',
          code: 'FILE_NOT_FOUND',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        relativePath,
        content,
      },
    });
  } catch (error) {
    logger.error('Failed to read session file', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to read file',
        code: 'READ_FILE_ERROR',
      },
      { status: 500 }
    );
  }
}
