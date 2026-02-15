'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useCopilotSessions, useCopilotSessionWatch } from '@/hooks';
import { UpdateDot } from './SessionUpdateIndicator';
import { ErrorBoundary } from './ErrorBoundary';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  Clock,
  RefreshCw,
  Terminal,
  Search,
} from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';

interface CopilotSessionBrowserProps {
  onFileSelect?: (sessionId: string, relativePath: string) => void;
  className?: string;
}

interface SessionFile {
  name: string;
  path: string;
  type: 'plan' | 'checkpoint' | 'file';
}

interface SessionDetails {
  id: string;
  workingDirectory: string | null;
  createdAt: number;
  lastModified: number;
  files: SessionFile[];
}

/**
 * Browser component for Copilot CLI sessions
 * Displays sessions and their markdown files with real-time update indicators
 */
export function CopilotSessionBrowser({
  onFileSelect,
  className,
}: CopilotSessionBrowserProps) {
  const { sessions, isLoading, error, refresh } = useCopilotSessions({
    sortBy: 'lastModified',
    sortOrder: 'desc',
  });

  const { updatedSessions, clearUpdated, isConnected } = useCopilotSessionWatch({
    enabled: true,
    onFileUpdated: () => {
      // Optionally refresh sessions list on file updates
      refresh();
    },
  });

  const { toggle: toggleSearch } = useSearch();

  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [sessionDetails, setSessionDetails] = useState<Record<string, SessionDetails>>({});
  const [loadingSession, setLoadingSession] = useState<string | null>(null);

  const toggleSession = async (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);

    if (expandedSessions.has(sessionId)) {
      newExpanded.delete(sessionId);
      setExpandedSessions(newExpanded);
    } else {
      newExpanded.add(sessionId);
      setExpandedSessions(newExpanded);

      // Clear update indicator when opened
      if (updatedSessions.has(sessionId)) {
        clearUpdated(sessionId);
      }

      // Fetch session details if not already loaded
      if (!sessionDetails[sessionId]) {
        setLoadingSession(sessionId);
        try {
          const response = await fetch(`/api/copilot-sessions/${encodeURIComponent(sessionId)}`);
          const data = await response.json();
          if (data.success) {
            setSessionDetails((prev) => ({
              ...prev,
              [sessionId]: data.data,
            }));
          }
        } catch (err) {
          logger.error('Failed to fetch session details:', err);
        } finally {
          setLoadingSession(null);
        }
      }
    }
  };

  const handleFileClick = (sessionId: string, file: SessionFile) => {
    onFileSelect?.(sessionId, file.path);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getSessionName = (session: { id: string; workingDirectory: string | null }) => {
    if (session.workingDirectory) {
      const parts = session.workingDirectory.split('/');
      return parts[parts.length - 1] || session.id.slice(0, 8);
    }
    return session.id.slice(0, 8);
  };

  const fileTypeIcon = (type: string) => {
    switch (type) {
      case 'plan':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'checkpoint':
        return <FileText className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading && sessions.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
        <p>Loading sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <p className="text-destructive mb-2">{error}</p>
        <button
          type="button"
          onClick={() => refresh()}
          className="text-sm text-blue-500 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No Copilot CLI sessions found</p>
        <p className="text-sm mt-1">
          Sessions are stored in ~/.copilot/session-state
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sessions</span>
          {isConnected && (
            <span className="w-2 h-2 rounded-full bg-green-500" title="Connected" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleSearch}
            className="p-1 rounded hover:bg-muted"
            title="Search (Cmd+K)"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => refresh()}
            className="p-1 rounded hover:bg-muted"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-auto">
        {sessions.map((session) => {
          const isExpanded = expandedSessions.has(session.id);
          const hasUpdate = updatedSessions.has(session.id);
          const details = sessionDetails[session.id];
          const isLoadingDetails = loadingSession === session.id;

          return (
            <div key={session.id} className="border-b last:border-b-0">
              {/* Session header */}
              <button
                type="button"
                onClick={() => toggleSession(session.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left',
                  'hover:bg-muted/50 transition-colors',
                  isExpanded && 'bg-muted/30'
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0" />
                )}

                <FolderOpen className="w-4 h-4 shrink-0 text-muted-foreground" />

                <span className="flex-1 truncate text-sm font-medium">
                  {getSessionName(session)}
                </span>

                {hasUpdate && <UpdateDot />}

                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatTime(session.lastModified)}
                </span>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="pl-8 pb-2">
                  {isLoadingDetails ? (
                    <div className="py-2 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : details?.files?.length ? (
                    <div className="space-y-0.5">
                      {details.files.map((file) => (
                        <button
                          key={file.path}
                          type="button"
                          onClick={() => handleFileClick(session.id, file)}
                          className={cn(
                            'w-full flex items-center gap-2 px-2 py-1 rounded',
                            'text-left text-sm',
                            'hover:bg-muted/50 transition-colors'
                          )}
                        >
                          {fileTypeIcon(file.type)}
                          <span className="truncate">{file.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-2 text-sm text-muted-foreground">
                      No markdown files
                    </div>
                  )}

                  {session.workingDirectory && (
                    <div className="mt-2 px-2 text-xs text-muted-foreground truncate">
                      {session.workingDirectory}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * CopilotSessionBrowser wrapped with ErrorBoundary for production resilience
 */
export function CopilotSessionBrowserWithErrorBoundary(props: CopilotSessionBrowserProps) {
  return (
    <ErrorBoundary>
      <CopilotSessionBrowser {...props} />
    </ErrorBoundary>
  );
}
