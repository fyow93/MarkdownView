/**
 * State Components - Loading, Error, Empty states for MarkdownViewer
 * Extracted for reusability and better testing
 */

'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, RefreshCw } from 'lucide-react';

/**
 * Props for LoadingState component
 */
export interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = memo(({ 
  message = 'Loading...', 
  subMessage
}) => {
  return (
    <Card className="h-full bg-linear-to-br from-background to-muted/30">
      <CardContent className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
          <div>
            <div className="text-lg font-medium mb-2">{message}</div>
            {subMessage && <div className="text-sm text-muted-foreground">{subMessage}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

LoadingState.displayName = 'LoadingState';

/**
 * Props for ErrorState component
 */
export interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  title?: string;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = memo(({ 
  error, 
  onRetry,
  title = 'Load Failed',
  retryLabel = 'Retry'
}) => {
  return (
    <Card className="h-full border-destructive/50 bg-destructive/5">
      <CardContent className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <div className="text-lg font-medium mb-2 text-destructive">{title}</div>
            <div className="text-sm text-muted-foreground mb-4">{error}</div>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {retryLabel}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ErrorState.displayName = 'ErrorState';

/**
 * Props for EmptyState component - shown when no file is selected
 */
export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = memo(({ 
  title = 'Markdown Viewer',
  description = 'Please select a Markdown file to view its content',
  icon
}) => {
  return (
    <Card className="h-full bg-linear-to-br from-background to-muted/30">
      <CardContent className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            {icon || <FileText className="h-8 w-8 text-primary" />}
          </div>
          <div>
            <div className="text-xl font-semibold mb-2 text-primary">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

EmptyState.displayName = 'EmptyState';

/**
 * Props for ConnectionStatus indicator component
 */
export interface ConnectionStatusProps {
  isConnected: boolean;
  isEnabled: boolean;
  onToggle?: () => void;
  connectedLabel?: string;
  disconnectedLabel?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = memo(({
  isConnected,
  isEnabled,
  onToggle,
  connectedLabel = 'Real-time: On',
  disconnectedLabel = 'Real-time: Off'
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={`text-xs ${isConnected && isEnabled ? 'text-green-600' : 'text-muted-foreground'}`}
    >
      <span 
        className={`inline-block w-2 h-2 rounded-full mr-2 ${
          isConnected && isEnabled ? 'bg-green-500' : 'bg-gray-400'
        }`} 
      />
      {isConnected && isEnabled ? connectedLabel : disconnectedLabel}
    </Button>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';
