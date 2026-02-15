/**
 * Custom Tag Handler
 * 
 * Handles unknown/custom XML tags in markdown content that would otherwise
 * cause React warnings about unrecognized elements.
 * 
 * When ReactMarkdown with rehype-raw processes markdown containing custom
 * XML-like tags (e.g., <overview>, <thinking>), these pass through to React
 * which warns: "The tag <X> is unrecognized in this browser."
 * 
 * This module provides utilities to:
 * 1. Detect if a tag is a custom/unknown XML tag
 * 2. Wrap custom tags in valid HTML elements with data attributes
 */

'use client';

import React, { ReactNode } from 'react';

/**
 * Complete list of valid HTML tags that should NOT be treated as custom tags
 * Includes HTML5 semantic elements
 */
export const KNOWN_HTML_TAGS = new Set([
  // Document metadata
  'html', 'head', 'title', 'base', 'link', 'meta', 'style',
  
  // Sectioning
  'body', 'article', 'section', 'nav', 'aside', 'header', 'footer', 'main', 'address',
  
  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  
  // Content grouping
  'p', 'hr', 'pre', 'blockquote', 'ol', 'ul', 'li', 'dl', 'dt', 'dd',
  'figure', 'figcaption', 'div',
  
  // Text semantics
  'a', 'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'ruby', 'rt', 'rp',
  'data', 'time', 'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u', 'mark',
  'bdi', 'bdo', 'span', 'br', 'wbr',
  
  // Edits
  'ins', 'del',
  
  // Embedded content
  'picture', 'source', 'img', 'iframe', 'embed', 'object', 'param', 'video', 'audio',
  'track', 'map', 'area',
  
  // Tabular data
  'table', 'caption', 'colgroup', 'col', 'tbody', 'thead', 'tfoot', 'tr', 'td', 'th',
  
  // Forms
  'form', 'label', 'input', 'button', 'select', 'datalist', 'optgroup', 'option',
  'textarea', 'output', 'progress', 'meter', 'fieldset', 'legend',
  
  // Interactive elements
  'details', 'summary', 'dialog',
  
  // Scripting
  'script', 'noscript', 'template', 'slot', 'canvas',
  
  // SVG elements (common ones)
  'svg', 'path', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'rect',
  'g', 'defs', 'use', 'symbol', 'text', 'tspan', 'image',
  
  // Deprecated but still valid
  'center', 'font', 'strike', 'tt',
]);

/**
 * Check if a tag name is a custom/unknown XML tag
 * 
 * Returns true if:
 * - The tag is lowercase (not a React component)
 * - The tag is NOT a known HTML element
 * - The tag is not empty
 * 
 * @param tagName - The tag name to check
 * @returns true if it's a custom XML tag that needs wrapping
 */
export function isCustomXmlTag(tagName: string): boolean {
  // Empty or invalid
  if (!tagName || typeof tagName !== 'string') {
    return false;
  }
  
  // React components start with uppercase - these are handled by React
  if (tagName[0] === tagName[0].toUpperCase()) {
    return false;
  }
  
  // Check if it's a known HTML tag
  return !KNOWN_HTML_TAGS.has(tagName.toLowerCase());
}

/**
 * Props for CustomTagWrapper component
 */
export interface CustomTagWrapperProps {
  /** Original custom tag name */
  tagName: string;
  /** Child content */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * Wrapper component for custom XML tags
 * 
 * Renders custom tags as a <div> with:
 * - data-custom-tag attribute for identification
 * - Visual styling to distinguish custom content
 * 
 * @example
 * <CustomTagWrapper tagName="overview">
 *   Content here
 * </CustomTagWrapper>
 * // Renders: <div data-custom-tag="overview" class="custom-xml-tag">Content here</div>
 */
export const CustomTagWrapper: React.FC<CustomTagWrapperProps> = ({
  tagName,
  children,
  className = '',
}) => {
  const classes = `custom-xml-tag ${className}`.trim();
  
  return (
    <div data-custom-tag={tagName} className={classes}>
      {children}
    </div>
  );
};

/**
 * Create a components object for ReactMarkdown that handles custom tags
 * 
 * This generates handler functions for common custom tags that might appear
 * in markdown content (like AI output, documentation formats, etc.)
 * 
 * @param additionalTags - Additional custom tag names to handle
 * @returns Object of tag handlers for ReactMarkdown components prop
 */
export function createCustomTagHandlers(additionalTags: string[] = []): Record<string, React.FC<{ children?: ReactNode }>> {
  const commonCustomTags = [
    'overview', 'thinking', 'plan', 'response', 'output', 'result',
    'example', 'note', 'warning', 'info', 'tip', 'caution',
    'step', 'task', 'action', 'context', 'reference',
    'history', 'summary', 'analysis', 'conclusion', 'recommendation',
  ];
  
  const allTags = [...new Set([...commonCustomTags, ...additionalTags])];
  
  const handlers: Record<string, React.FC<{ children?: ReactNode }>> = {};
  
  for (const tag of allTags) {
    handlers[tag] = ({ children }) => (
      <CustomTagWrapper tagName={tag}>{children}</CustomTagWrapper>
    );
  }
  
  return handlers;
}

export default CustomTagWrapper;
