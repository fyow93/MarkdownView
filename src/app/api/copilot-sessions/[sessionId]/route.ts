/**
 * API Route: Get Session Details
 * GET /api/copilot-sessions/[sessionId]
 * 
 * Returns session details including files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionFiles, isValidSessionId } from '@/lib/copilot-session';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params;
    
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
    
    const session = await getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        },
        { status: 404 }
      );
    }
    
    // Get files in the session
    const files = await getSessionFiles(sessionId);
    
    return NextResponse.json({
      success: true,
      data: {
        ...session,
        files,
      },
    });
  } catch (error) {
    logger.error('Failed to get session', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get session details',
        code: 'GET_SESSION_ERROR',
      },
      { status: 500 }
    );
  }
}
