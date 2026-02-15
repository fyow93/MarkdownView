/**
 * BackToTopButton Component
 * Floating button that scrolls to top when visible
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackToTopButtonProps {
  visible: boolean;
  onClick: () => void;
  className?: string;
  label?: string;
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({
  visible,
  onClick,
  className,
  label = 'Back to top'
}) => {
  if (!visible) return null;

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 rounded-full shadow-lg',
        'transition-all duration-300 ease-in-out',
        'hover:scale-110 hover:shadow-xl',
        'focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
      aria-label={label}
      title={label}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
};

// Named export only for consistency and better tree-shaking
