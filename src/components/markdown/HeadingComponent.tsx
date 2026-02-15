'use client';

import React, { memo, useCallback } from 'react';
import { Hash } from 'lucide-react';
import { extractTextFromReactNode, generateHeadingId } from '@/lib/markdown-utils';

interface HeadingComponentProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: number;
  children?: React.ReactNode;
  onHeadingClick?: (id: string) => void;
}

const HeadingComponent: React.FC<HeadingComponentProps> = memo(({ 
  level, 
  children, 
  onHeadingClick,
  ...props 
}) => {
  const text = extractTextFromReactNode(children);
  const id = generateHeadingId(text);

  const handleClick = useCallback(() => {
    onHeadingClick?.(id);
  }, [id, onHeadingClick]);

  const className = `
    scroll-mt-24 font-semibold tracking-tight group
    ${level === 1 ? 'text-3xl lg:text-4xl mb-6 text-primary border-b pb-3' : ''}
    ${level === 2 ? 'text-2xl lg:text-3xl mt-8 mb-4 text-primary/90' : ''}
    ${level === 3 ? 'text-xl lg:text-2xl mt-6 mb-3 text-primary/80' : ''}
    ${level === 4 ? 'text-lg lg:text-xl mt-4 mb-2 text-primary/70' : ''}
    ${level === 5 ? 'text-base lg:text-lg mt-3 mb-2 text-primary/60' : ''}
    ${level === 6 ? 'text-sm lg:text-base mt-2 mb-2 text-primary/50' : ''}
  `;

  const content = (
    <span className="flex items-center gap-2">
      {children}
      <Hash 
        className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity cursor-pointer" 
        onClick={handleClick}
      />
    </span>
  );
  
  switch (level) {
    case 1:
      return <h1 id={id} className={className} {...props}>{content}</h1>;
    case 2:
      return <h2 id={id} className={className} {...props}>{content}</h2>;
    case 3:
      return <h3 id={id} className={className} {...props}>{content}</h3>;
    case 4:
      return <h4 id={id} className={className} {...props}>{content}</h4>;
    case 5:
      return <h5 id={id} className={className} {...props}>{content}</h5>;
    case 6:
      return <h6 id={id} className={className} {...props}>{content}</h6>;
    default:
      return <h2 id={id} className={className} {...props}>{content}</h2>;
  }
});

HeadingComponent.displayName = 'HeadingComponent';

export default HeadingComponent;
