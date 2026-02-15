/**
 * Type definitions for React-markdown and markdown components
 */

import type React from 'react';

/**
 * Base component props for markdown elements
 * Using Record<string, unknown> to be compatible with react-markdown ExtraProps
 */
export type MarkdownComponentProps = {
  children?: React.ReactNode;
  className?: string;
} & Record<string, unknown>;

/**
 * Props for code block component
 */
export interface CodeBlockProps extends MarkdownComponentProps {
  inline?: boolean;
  node?: unknown;
}

/**
 * Props for heading components
 */
export interface HeadingProps extends MarkdownComponentProps {
  level: number;
  id?: string;
}

/**
 * Props for blockquote component
 */
export type BlockquoteProps = MarkdownComponentProps;

/**
 * Props for table elements
 */
export type TableProps = MarkdownComponentProps;

export type TableHeaderProps = MarkdownComponentProps;

export type TableBodyProps = MarkdownComponentProps;

export type TableRowProps = MarkdownComponentProps;

export type TableCellProps = {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'justify' | 'char';
} & Record<string, unknown>;
