/**
 * API Response Normalization Utilities
 *
 * Handles different response formats from various API endpoints:
 * - Regular file API: { content, lastModified, size }
 * - Copilot sessions API: { success, data: { sessionId, relativePath, content } }
 */

export interface NormalizedFileResponse {
  content: string;
  lastModified?: string;
  size?: number;
}

export interface RegularFileApiResponse {
  content: string;
  lastModified?: string;
  size?: number;
}

export interface CopilotSessionsApiResponse {
  success: boolean;
  data: {
    sessionId: string;
    relativePath: string;
    content: string;
  };
}

export type FileApiResponse = RegularFileApiResponse | CopilotSessionsApiResponse;

/**
 * Checks if the response is from the Copilot Sessions API
 */
export function isCopilotSessionsResponse(
  data: FileApiResponse
): data is CopilotSessionsApiResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    'data' in data &&
    typeof (data as CopilotSessionsApiResponse).data === 'object' &&
    'content' in (data as CopilotSessionsApiResponse).data
  );
}

/**
 * Normalizes API responses from different endpoints to a unified format
 */
export function normalizeFileApiResponse(
  data: FileApiResponse
): NormalizedFileResponse {
  if (isCopilotSessionsResponse(data)) {
    return {
      content: data.data.content,
      // Copilot sessions API doesn't provide lastModified or size
      lastModified: undefined,
      size: undefined,
    };
  }

  // Regular file API response
  return {
    content: data.content,
    lastModified: data.lastModified,
    size: data.size,
  };
}
