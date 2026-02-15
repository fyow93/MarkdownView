import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Encode a file path for use in API URLs with catch-all routes.
 * Encodes each path segment individually while preserving '/' as separator.
 * 
 * @example
 * encodeFilePath('docs/README.md') // returns 'docs/README.md'
 * encodeFilePath('文档/说明.md') // returns '%E6%96%87%E6%A1%A3/%E8%AF%B4%E6%98%8E.md'
 */
export function encodeFilePath(filePath: string): string {
  if (!filePath) return '';
  
  return filePath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

/**
 * Build the correct API URL for fetching a file.
 * If the path already starts with '/api/', it's assumed to be a full API path
 * (e.g., copilot session files) and is returned as-is.
 * Otherwise, prepends '/api/file/' and encodes the path.
 * 
 * @example
 * buildFileApiUrl('docs/README.md') // returns '/api/file/docs/README.md'
 * buildFileApiUrl('/api/copilot-sessions/file/abc/test.md') // returns '/api/copilot-sessions/file/abc/test.md'
 */
export function buildFileApiUrl(filePath: string): string {
  if (!filePath) return '';
  
  // If path already starts with /api/, it's a full API path - use as-is
  if (filePath.startsWith('/api/')) {
    return filePath;
  }
  
  // Regular file path - prepend /api/file/ and encode
  return `/api/file/${encodeFilePath(filePath)}`;
}