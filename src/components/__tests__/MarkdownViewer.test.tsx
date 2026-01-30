import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MarkdownViewer from '../MarkdownViewer';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Types for mock props
interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface LeftSideTocMockProps {
  toc: TocItem[];
  activeId: string;
  onItemClick: (id: string) => void;
  isVisible: boolean;
}

interface BackToTopButtonMockProps {
  visible: boolean;
  onClick: () => void;
}

interface MarkdownHeaderMockProps {
  filePath: string;
  showToc: boolean;
  setShowToc: (show: boolean) => void;
}

interface MarkdownContentMockProps {
  content: string;
}

interface ErrorStateMockProps {
  title: string;
}

interface UseMarkdownLoaderProps {
  filePath?: string;
}

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
  },
}));

vi.mock('@/components/markdown', () => ({
  LeftSideToc: ({ toc, activeId, onItemClick, isVisible }: LeftSideTocMockProps) => (
    isVisible ? (
      <div data-testid="left-side-toc">
        {toc.map((item: TocItem) => (
          <div 
            key={item.id} 
            data-testid={`toc-item-${item.id}`}
            onClick={() => onItemClick(item.id)}
            className={activeId === item.id ? 'active' : ''}
          >
            {item.text}
          </div>
        ))}
      </div>
    ) : null
  ),
  BackToTopButton: ({ visible, onClick }: BackToTopButtonMockProps) => (
    visible ? <button data-testid="back-to-top" onClick={onClick}>Top</button> : null
  ),
}));

vi.mock('@/components/markdown/MarkdownHeader', () => ({
  default: ({ filePath, showToc, setShowToc }: MarkdownHeaderMockProps) => (
    <div data-testid="markdown-header">
      <span>{filePath}</span>
      <button data-testid="toggle-toc" onClick={() => setShowToc(!showToc)}>Toggle TOC</button>
    </div>
  ),
}));

vi.mock('@/components/markdown/MarkdownContent', () => ({
  default: ({ content }: MarkdownContentMockProps) => <div data-testid="markdown-content">{content}</div>,
}));

vi.mock('@/components/markdown/StateComponents', () => ({
  ErrorState: ({ title }: ErrorStateMockProps) => <div data-testid="error-state">{title}</div>,
  EmptyState: () => <div data-testid="empty-state">No File Selected</div>,
}));

// Mock hooks
const mockLoadContent = vi.fn();
const mockSetIsRealTimeEnabled = vi.fn();
const mockSetActiveHeadingId = vi.fn();
const mockScrollToTop = vi.fn();
const mockScrollToHeading = vi.fn();
const mockClearScrollPosition = vi.fn();

vi.mock('@/hooks/useMarkdownLoader', () => ({
  useMarkdownLoader: ({ filePath }: UseMarkdownLoaderProps) => {
    if (!filePath) {
      return { 
        content: '', 
        toc: [], 
        loading: false, 
        error: null,
        activeHeadingId: '' 
      };
    }
    if (filePath === 'error.md') {
      return { 
        content: '', 
        toc: [], 
        loading: false, 
        error: new Error('Failed to load'),
        activeHeadingId: '' 
      };
    }
    if (filePath === 'loading.md') {
      return { 
        content: '', 
        toc: [], 
        loading: true, 
        error: null,
        activeHeadingId: '' 
      };
    }
    return {
      content: '# Hello World',
      toc: [{ id: 'hello-world', text: 'Hello World', level: 1 }],
      loading: false,
      error: null,
      lastUpdateTime: new Date(),
      isConnected: true,
      isRealTimeEnabled: true,
      setIsRealTimeEnabled: mockSetIsRealTimeEnabled,
      loadContent: mockLoadContent,
      activeHeadingId: 'hello-world',
      setActiveHeadingId: mockSetActiveHeadingId
    };
  }
}));

vi.mock('@/hooks/useScrollPosition', () => ({
  useScrollPosition: () => ({
    showBackToTop: true,
    scrollToTop: mockScrollToTop,
    scrollToHeading: mockScrollToHeading,
    clearScrollPosition: mockClearScrollPosition,
    handleScroll: vi.fn(),
  })
}));

describe('MarkdownViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no filePath is provided', () => {
    render(<MarkdownViewer />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    // We need to look for skeleton elements which are rendered directly in the component
    // Since skeleton uses class names, we can check for specific structure or class presence
    const { container } = render(<MarkdownViewer filePath="loading.md" />);
    // Check for skeleton elements by class (shadcn skeleton has animate-pulse)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(<MarkdownViewer filePath="error.md" />);
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
  });

  it('renders content when loaded successfully', () => {
    render(<MarkdownViewer filePath="test.md" />);
    expect(screen.getByTestId('markdown-header')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(screen.getByTestId('left-side-toc')).toBeInTheDocument();
    expect(screen.getByText('test.md')).toBeInTheDocument();
  });

  it('toggles TOC visibility', () => {
    render(<MarkdownViewer filePath="test.md" />);
    const toggleButton = screen.getByTestId('toggle-toc');
    const toc = screen.getByTestId('left-side-toc');
    
    expect(toc).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    
    // After clicking, the TOC should be hidden (not rendered by mock)
    expect(screen.queryByTestId('left-side-toc')).not.toBeInTheDocument();
  });

  it('calls scrollToTop when back to top button is clicked', () => {
    render(<MarkdownViewer filePath="test.md" />);
    const backToTop = screen.getByTestId('back-to-top');
    
    fireEvent.click(backToTop);
    expect(mockScrollToTop).toHaveBeenCalled();
  });

  it('calls scrollToHeading when TOC item is clicked', () => {
    render(<MarkdownViewer filePath="test.md" />);
    const tocItem = screen.getByTestId('toc-item-hello-world');
    
    fireEvent.click(tocItem);
    expect(mockScrollToHeading).toHaveBeenCalledWith('hello-world');
  });
});
