'use client';

import { cn } from '@/lib/utils';

interface SessionUpdateIndicatorProps {
  count?: number;
  pulse?: boolean;
  className?: string;
}

/**
 * Visual indicator badge for session updates
 * Shows a pulsing dot when there are updates, with optional count
 */
export function SessionUpdateIndicator({
  count = 0,
  pulse = true,
  className,
}: SessionUpdateIndicatorProps) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'min-w-[18px] h-[18px] px-1',
        'text-xs font-medium text-white',
        'bg-blue-500 rounded-full',
        pulse && 'animate-pulse',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

interface UpdateDotProps {
  visible?: boolean;
  className?: string;
}

/**
 * Simple dot indicator for file updates
 */
export function UpdateDot({ visible = true, className }: UpdateDotProps) {
  if (!visible) return null;

  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full',
        'bg-blue-500 animate-pulse',
        className
      )}
      aria-label="Updated"
    />
  );
}
