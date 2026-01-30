/**
 * Markdown-related components
 * Extracted from MarkdownViewer for better maintainability
 */

export { MermaidChart, LazyMermaidChart } from './MermaidChart';
export { default as LeftSideToc } from './LeftSideToc';
export type { TocItem } from './LeftSideToc';
export { default as CodeBlock } from './CodeBlock';
export { default as HeadingComponent } from './HeadingComponent';
// Re-export generateHeadingId from utils for backward compatibility if needed, 
// or just export from utils directly. Since previous code imported from here, 
// let's re-export from utils but make it clear where it comes from.
export { generateHeadingId } from '@/lib/markdown-utils';

export { LoadingState, ErrorState, EmptyState, ConnectionStatus } from './StateComponents';
export type { 
  LoadingStateProps, 
  ErrorStateProps, 
  EmptyStateProps, 
  ConnectionStatusProps 
} from './StateComponents';
export { BackToTopButton } from './BackToTopButton';
export { 
  CustomTagWrapper, 
  isCustomXmlTag, 
  createCustomTagHandlers,
  KNOWN_HTML_TAGS,
} from './CustomTagHandler';
export type { CustomTagWrapperProps } from './CustomTagHandler';
