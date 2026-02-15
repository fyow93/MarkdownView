'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Kbd } from '@/components/ui/kbd';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  { keys: ['Home'], action: 'Scroll to top' },
  { keys: ['End'], action: 'Scroll to bottom' },
  { keys: ['Ctrl', 'B'], action: 'Toggle table of contents' },
  { keys: ['Ctrl', 'K'], action: 'Focus search' },
  { keys: ['Ctrl', 'R'], action: 'Refresh content' },
  { keys: ['Ctrl', '↑'], action: 'Jump to previous heading' },
  { keys: ['Ctrl', '↓'], action: 'Jump to next heading' },
  { keys: ['Ctrl', 'P'], action: 'Quick file open' },
  { keys: ['Ctrl', '['], action: 'Previous file in tabs' },
  { keys: ['Ctrl', ']'], action: 'Next file in tabs' },
  { keys: ['F11'], action: 'Focus mode (hide sidebars)' },
  { keys: ['?'], action: 'Show keyboard shortcuts' },
  { keys: ['Escape'], action: 'Close dialogs' },
];

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Press any key combination to trigger the action
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {SHORTCUTS.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {shortcut.action}
                </span>
                <Kbd>{shortcut.keys}</Kbd>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
