'use client';

import { cn } from '@/lib/utils';
import { FolderOpen, Terminal } from 'lucide-react';

export type ViewMode = 'project' | 'session';

interface ModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  sessionCount?: number;
  className?: string;
}

/**
 * Toggle between Project mode (local files) and Session mode (Copilot CLI sessions)
 */
export function ModeToggle({
  mode,
  onChange,
  sessionCount = 0,
  className,
}: ModeToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg',
        'bg-muted p-1 text-muted-foreground',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange('project')}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
          'transition-all',
          mode === 'project'
            ? 'bg-background text-foreground shadow-sm'
            : 'hover:text-foreground'
        )}
      >
        <FolderOpen className="w-4 h-4" />
        <span>Project</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('session')}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
          'transition-all relative',
          mode === 'session'
            ? 'bg-background text-foreground shadow-sm'
            : 'hover:text-foreground'
        )}
      >
        <Terminal className="w-4 h-4" />
        <span>Sessions</span>
        {sessionCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white bg-blue-500 rounded-full">
            {sessionCount > 99 ? '99+' : sessionCount}
          </span>
        )}
      </button>
    </div>
  );
}
