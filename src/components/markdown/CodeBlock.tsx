'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Prism as SyntaxHighlighter, SyntaxHighlighterProps } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { LazyMermaidChart } from './MermaidChart';

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  node?: unknown;
  [key: string]: unknown;
}

export const CodeBlock: React.FC<CodeBlockProps> = memo(({ className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  
  if (language === 'mermaid') {
    return <LazyMermaidChart chart={String(children).replace(/\n$/, '')} />;
  }
  
  if (match) {
    return (
      <Card className="my-4 overflow-hidden border-muted">
        <CardHeader className="pb-2 bg-muted/50">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs font-mono">
              {language}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <SyntaxHighlighter
            style={tomorrow as SyntaxHighlighterProps['style']}
            language={language}
            PreTag="div"
            className="m-0! rounded-none!"
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
      {children}
    </code>
  );
});

CodeBlock.displayName = 'CodeBlock';

export default CodeBlock;
