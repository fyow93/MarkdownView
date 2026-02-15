import React from 'react';

interface KbdProps {
  children: string | string[];
}

export function Kbd({ children }: KbdProps) {
  const keys = Array.isArray(children) ? children : [children];

  return (
    <kbd className="inline-flex items-center gap-0.5 px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-muted-foreground">+</span>}
          <span className="font-mono">{key}</span>
        </React.Fragment>
      ))}
    </kbd>
  );
}
