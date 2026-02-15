import { useCallback, useState } from 'react';
import type { TocItem } from '@/components/markdown';
import { generateHeadingId } from '@/components/markdown';

interface UseTocResult {
  toc: TocItem[];
  setToc: React.Dispatch<React.SetStateAction<TocItem[]>>;
  activeHeadingId: string;
  setActiveHeadingId: React.Dispatch<React.SetStateAction<string>>;
  generateToc: (markdown: string) => TocItem[];
  updateToc: (markdown: string) => TocItem[];
  generateId: (text: string) => string;
}

/**
 * Hook for generating and managing Table of Contents from markdown content
 */
export function useToc(): UseTocResult {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  // Generate heading ID - consistent with markdown component
  const generateId = useCallback((text: string): string => {
    return generateHeadingId(text);
  }, []);

  // Generate TOC from markdown content
  const generateToc = useCallback((markdown: string): TocItem[] => {
    const flatHeadings: TocItem[] = [];
    
    // Parse code block positions to avoid treating # in code as headings
    const codeBlockRanges: Array<{ start: number; end: number }> = [];
    
    // Match fenced code blocks (``` or ~~~)
    const fencedCodeRegex = /^```[\s\S]*?^```|^~~~[\s\S]*?^~~~/gm;
    let codeMatch;
    while ((codeMatch = fencedCodeRegex.exec(markdown)) !== null) {
      codeBlockRanges.push({
        start: codeMatch.index,
        end: codeMatch.index + codeMatch[0].length
      });
    }
    
    // Match indented code blocks (4 spaces or tab)
    const indentedCodeRegex = /^(?: {4}|\t).*$/gm;
    while ((codeMatch = indentedCodeRegex.exec(markdown)) !== null) {
      codeBlockRanges.push({
        start: codeMatch.index,
        end: codeMatch.index + codeMatch[0].length
      });
    }
    
    // Sort code block ranges by start position
    codeBlockRanges.sort((a, b) => a.start - b.start);
    
    // Check if position is inside a code block
    const isInCodeBlock = (position: number): boolean => {
      return codeBlockRanges.some(range => position >= range.start && position <= range.end);
    };
    
    // Find headings, excluding those inside code blocks
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      if (isInCodeBlock(match.index)) {
        continue;
      }
      
      const level = match[1].length;
      const text = match[2].trim();
      
      if (text) {
        const id = generateId(text);
        // Clean display text
        const displayText = text
          .replace(/<[^>]*>/g, '')
          .replace(/[*_`~]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        flatHeadings.push({ 
          id, 
          text: displayText, 
          level,
          children: [],
          isCollapsed: false
        });
      }
    }

    // Build hierarchy structure
    const buildHierarchy = (headings: TocItem[]): TocItem[] => {
      const result: TocItem[] = [];
      const stack: TocItem[] = [];

      for (const heading of headings) {
        // Find appropriate parent level
        while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
          stack.pop();
        }

        if (stack.length === 0) {
          result.push(heading);
        } else {
          const parent = stack[stack.length - 1];
          if (!parent.children) parent.children = [];
          parent.children.push(heading);
        }

        stack.push(heading);
      }

      return result;
    };

    return buildHierarchy(flatHeadings);
  }, [generateId]);

  // Update TOC from markdown content
  const updateToc = useCallback((markdown: string) => {
    const newToc = generateToc(markdown);
    setToc(newToc);
    return newToc;
  }, [generateToc]);

  return {
    toc,
    setToc,
    activeHeadingId,
    setActiveHeadingId,
    generateToc,
    updateToc,
    generateId
  };
}

export type { TocItem };
