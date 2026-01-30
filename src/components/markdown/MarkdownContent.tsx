'use client';

import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Card, CardContent } from '@/components/ui/card';
import CodeBlock from './CodeBlock';
import HeadingComponent from './HeadingComponent';
import { createCustomTagHandlers } from './CustomTagHandler';

interface MarkdownContentProps {
  content: string;
  onHeadingClick: (id: string) => void;
}

// Define minimal types for React Markdown components to satisfy TypeScript/ESLint
// without relying on complex external type definitions that might mismatch.
// Using Record<string, unknown> as a safer alternative to 'any' for props.
type MarkdownProps = Record<string, unknown> & { children?: React.ReactNode };

const MarkdownContent: React.FC<MarkdownContentProps> = memo(({ content, onHeadingClick }) => {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Handle custom XML tags to prevent React warnings
          ...createCustomTagHandlers(),
          // @ts-expect-error - React Markdown component types are tricky
          code: CodeBlock,
          // @ts-expect-error - React Markdown component types are tricky
          h1: (props: MarkdownProps) => <HeadingComponent level={1} onHeadingClick={onHeadingClick} {...props} />,
          // @ts-expect-error - React Markdown component types are tricky
          h2: (props: MarkdownProps) => <HeadingComponent level={2} onHeadingClick={onHeadingClick} {...props} />,
          // @ts-expect-error - React Markdown component types are tricky
          h3: (props: MarkdownProps) => <HeadingComponent level={3} onHeadingClick={onHeadingClick} {...props} />,
          // @ts-expect-error - React Markdown component types are tricky
          h4: (props: MarkdownProps) => <HeadingComponent level={4} onHeadingClick={onHeadingClick} {...props} />,
          // @ts-expect-error - React Markdown component types are tricky
          h5: (props: MarkdownProps) => <HeadingComponent level={5} onHeadingClick={onHeadingClick} {...props} />,
          // @ts-expect-error - React Markdown component types are tricky
          h6: (props: MarkdownProps) => <HeadingComponent level={6} onHeadingClick={onHeadingClick} {...props} />,
          // @ts-expect-error - React Markdown component types are tricky
          blockquote: (props: MarkdownProps) => {
            const { children, ...restProps } = props;
            return (
              <blockquote className="border-l-4 border-primary/30 bg-primary/5 pl-4 py-2 my-4 italic" {...restProps}>
                {children}
              </blockquote>
            );
          },
          // @ts-expect-error - React Markdown component types are tricky
          table: (props: MarkdownProps) => {
            const { children, ...restProps } = props;
            return (
              <div className="my-6 not-prose">
                <Card className="overflow-hidden border-border/50 shadow-sm">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="custom-table w-full border-collapse border-0" {...restProps}>
                        {children}
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          },
          // @ts-expect-error - React Markdown component types are tricky
          th: (props: MarkdownProps) => {
            const { children, ...restProps } = props;
            return (
              <th className="custom-th border-r border-b border-border bg-muted/80 px-4 py-3 text-left font-semibold text-foreground first:border-l-0 last:border-r-0" {...restProps}>
                {children}
              </th>
            );
          },
          // @ts-expect-error - React Markdown component types are tricky
          td: (props: MarkdownProps) => {
            const { children, ...restProps } = props;
            return (
              <td className="custom-cd border-r border-b border-border px-4 py-3 text-foreground first:border-l-0 last:border-r-0" {...restProps}>
                {children}
              </td>
            );
          },
          // @ts-expect-error - React Markdown component types are tricky
          thead: (props: MarkdownProps) => {
            const { children, ...restProps } = props;
            return (
              <thead className="bg-muted/30" {...restProps}>
                {children}
              </thead>
            );
          },
          // @ts-expect-error - React Markdown component types are tricky
          tbody: (props: MarkdownProps) => {
            const { children, ...restProps } = props;
            return (
              <tbody className="divide-y divide-border" {...restProps}>
                {children}
              </tbody>
            );
          },
          // @ts-expect-error - React Markdown component types are tricky
          tr: (props: MarkdownProps) => {
            const { children, ...restProps } = props;
            return (
              <tr className="hover:bg-muted/20 transition-colors" {...restProps}>
                {children}
              </tr>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownContent.displayName = 'MarkdownContent';

export default MarkdownContent;
