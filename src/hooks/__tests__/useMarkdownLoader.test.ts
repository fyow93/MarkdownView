/**
 * Tests for useMarkdownLoader hook - TOC generation functions
 * TDD: Testing pure functions separately from React hooks
 */

import { describe, it, expect } from 'vitest';

// Test the pure function logic directly
// We'll extract and test generateToc and generateHeadingId

/**
 * Generate heading ID from text
 */
const generateHeadingId = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate flat TOC from markdown content
 */
const generateFlatToc = (markdown: string): Array<{ id: string; text: string; level: number }> => {
  const flatHeadings: Array<{ id: string; text: string; level: number }> = [];
  
  // Parse code block positions
  const codeBlockRanges: Array<{ start: number; end: number }> = [];
  
  const fencedCodeRegex = /^```[\s\S]*?^```|^~~~[\s\S]*?^~~~/gm;
  let codeMatch;
  while ((codeMatch = fencedCodeRegex.exec(markdown)) !== null) {
    codeBlockRanges.push({
      start: codeMatch.index,
      end: codeMatch.index + codeMatch[0].length
    });
  }
  
  const isInCodeBlock = (position: number): boolean => {
    return codeBlockRanges.some(range => position >= range.start && position <= range.end);
  };
  
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    if (isInCodeBlock(match.index)) {
      continue;
    }
    
    const level = match[1].length;
    const text = match[2].trim();
    
    if (text) {
      const id = generateHeadingId(text);
      const displayText = text.replace(/<[^>]*>/g, '').replace(/[*_`~]/g, '').replace(/\s+/g, ' ').trim();
      flatHeadings.push({ id, text: displayText, level });
    }
  }

  return flatHeadings;
};

describe('generateHeadingId', () => {
  it('should convert text to lowercase with dashes', () => {
    expect(generateHeadingId('Hello World')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(generateHeadingId('Hello! World?')).toBe('hello-world');
  });

  it('should handle Chinese characters', () => {
    expect(generateHeadingId('你好世界')).toBe('你好世界');
  });

  it('should handle mixed content', () => {
    expect(generateHeadingId('Hello 你好 World')).toBe('hello-你好-world');
  });

  it('should remove markdown formatting', () => {
    expect(generateHeadingId('**Bold** and *italic*')).toBe('bold-and-italic');
  });

  it('should strip HTML tags', () => {
    expect(generateHeadingId('<strong>Bold</strong> text')).toBe('bold-text');
  });
});

describe('generateFlatToc', () => {
  it('should extract headings from markdown', () => {
    const markdown = '# Heading 1\n\n## Heading 2\n\n### Heading 3';
    const toc = generateFlatToc(markdown);
    
    expect(toc).toHaveLength(3);
    expect(toc[0]).toEqual({ id: 'heading-1', text: 'Heading 1', level: 1 });
    expect(toc[1]).toEqual({ id: 'heading-2', text: 'Heading 2', level: 2 });
    expect(toc[2]).toEqual({ id: 'heading-3', text: 'Heading 3', level: 3 });
  });

  it('should handle empty markdown', () => {
    expect(generateFlatToc('')).toEqual([]);
  });

  it('should handle markdown without headings', () => {
    const markdown = 'Just some text\n\nMore text';
    expect(generateFlatToc(markdown)).toEqual([]);
  });

  it('should ignore headings in code blocks', () => {
    const markdown = '# Real Heading\n\n```\n# Not a heading\n```\n\n## Another Real';
    const toc = generateFlatToc(markdown);
    
    expect(toc).toHaveLength(2);
    expect(toc[0].text).toBe('Real Heading');
    expect(toc[1].text).toBe('Another Real');
  });

  it('should handle all heading levels', () => {
    const markdown = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
    const toc = generateFlatToc(markdown);
    
    expect(toc).toHaveLength(6);
    expect(toc.map(h => h.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should strip markdown formatting from heading text', () => {
    const markdown = '# **Bold** and *italic* heading';
    const toc = generateFlatToc(markdown);
    
    expect(toc[0].text).toBe('Bold and italic heading');
  });
});
