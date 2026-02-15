import { NextRequest, NextResponse } from 'next/server';
import { searchSessions } from '@/lib/search';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const sessionId = searchParams.get('sessionId') || undefined;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        { success: true, data: [] }
      );
    }

    const results = await searchSessions(query, sessionId);
    
    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        count: results.length,
        query
      }
    });
  } catch (error) {
    logger.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during search' },
      { status: 500 }
    );
  }
}
