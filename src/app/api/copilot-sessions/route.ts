/**
 * API Route: List Copilot CLI Sessions
 * GET /api/copilot-sessions
 * 
 * Returns list of all sessions with metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { listSessions } from '@/lib/copilot-session';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate pagination options
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const sortBy = searchParams.get('sortBy') as 'lastModified' | 'createdAt' | null;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null;
    
    // Validate numeric parameters
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
    const parsedOffset = offsetParam ? parseInt(offsetParam, 10) : undefined;
    
    if (parsedLimit !== undefined && (isNaN(parsedLimit) || parsedLimit < 0 || parsedLimit > 1000)) {
      return NextResponse.json(
        { success: false, error: 'Invalid limit parameter', code: 'INVALID_LIMIT' },
        { status: 400 }
      );
    }
    
    if (parsedOffset !== undefined && (isNaN(parsedOffset) || parsedOffset < 0)) {
      return NextResponse.json(
        { success: false, error: 'Invalid offset parameter', code: 'INVALID_OFFSET' },
        { status: 400 }
      );
    }
    
    // Validate enum parameters
    if (sortBy && !['lastModified', 'createdAt'].includes(sortBy)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sortBy parameter', code: 'INVALID_SORT_BY' },
        { status: 400 }
      );
    }
    
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sortOrder parameter', code: 'INVALID_SORT_ORDER' },
        { status: 400 }
      );
    }
    
    const options = {
      ...(parsedLimit !== undefined && { limit: parsedLimit }),
      ...(parsedOffset !== undefined && { offset: parsedOffset }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
    };
    
    const sessions = await listSessions(options);
    
    return NextResponse.json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error) {
    logger.error('Failed to list sessions', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list sessions',
        code: 'LIST_SESSIONS_ERROR',
      },
      { status: 500 }
    );
  }
}
