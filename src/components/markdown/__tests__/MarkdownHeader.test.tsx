import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MarkdownHeader from '../MarkdownHeader';
import { vi, describe, it, expect } from 'vitest';

interface ButtonMockProps {
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: string;
  title?: string;
  size?: string;
}

interface IconMockProps {
  className?: string;
}

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/ui/card', () => ({
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="card-title" className={className}>{children}</h2>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ onClick, children, className, disabled, variant, title }: ButtonMockProps) => (
    <button 
      onClick={onClick} 
      className={className} 
      disabled={disabled}
      data-variant={variant}
      title={title}
    >
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  FileText: ({ className }: IconMockProps) => <span data-testid="icon-file" className={className} />,
  Clock: ({ className }: IconMockProps) => <span data-testid="icon-clock" className={className} />,
  List: ({ className }: IconMockProps) => <span data-testid="icon-list" className={className} />,
  RefreshCw: ({ className }: IconMockProps) => <span data-testid="icon-refresh" className={className} />,
  Wifi: ({ className }: IconMockProps) => <span data-testid="icon-wifi" className={className} />,
  WifiOff: ({ className }: IconMockProps) => <span data-testid="icon-wifi-off" className={className} />,
  MapPin: ({ className }: IconMockProps) => <span data-testid="icon-map-pin" className={className} />,
}));

describe('MarkdownHeader', () => {
  const defaultProps = {
    filePath: 'docs/test.md',
    toc: [{ id: '1', text: 'Header 1', level: 1 }],
    showToc: true,
    setShowToc: vi.fn(),
    lastUpdateTime: '1/1/2023, 12:00:00 PM',
    isRealTimeEnabled: true,
    setIsRealTimeEnabled: vi.fn(),
    isConnected: true,
    onClearScroll: vi.fn(),
    onRefresh: vi.fn(),
  };

  it('renders file path and update time', () => {
    render(<MarkdownHeader {...defaultProps} />);
    expect(screen.getByText('test.md')).toBeInTheDocument();
    expect(screen.getByText(/1\/1\/2023/)).toBeInTheDocument();
  });

  it('handles TOC toggle', () => {
    const setShowToc = vi.fn();
    render(<MarkdownHeader {...defaultProps} setShowToc={setShowToc} />);
    
    const toggleBtn = screen.getByTestId('icon-list').closest('button');
    fireEvent.click(toggleBtn!);
    
    expect(setShowToc).toHaveBeenCalledWith(false);
  });

  it('handles refresh action', () => {
    const onRefresh = vi.fn();
    render(<MarkdownHeader {...defaultProps} onRefresh={onRefresh} />);
    
    const refreshBtn = screen.getByTestId('icon-refresh').closest('button');
    fireEvent.click(refreshBtn!);
    
    expect(onRefresh).toHaveBeenCalled();
  });

  it('handles clear scroll action', () => {
    const onClearScroll = vi.fn();
    render(<MarkdownHeader {...defaultProps} onClearScroll={onClearScroll} />);
    
    const clearBtn = screen.getByTestId('icon-map-pin').closest('button');
    fireEvent.click(clearBtn!);
    
    expect(onClearScroll).toHaveBeenCalled();
  });

  it('toggles real-time status', () => {
    const setIsRealTimeEnabled = vi.fn();
    render(<MarkdownHeader {...defaultProps} setIsRealTimeEnabled={setIsRealTimeEnabled} />);
    
    const wifiBtn = screen.getByTestId('icon-wifi').closest('button');
    fireEvent.click(wifiBtn!);
    
    expect(setIsRealTimeEnabled).toHaveBeenCalledWith(false);
  });

  it('shows wifi-off icon when realtime is disabled', () => {
    render(<MarkdownHeader {...defaultProps} isRealTimeEnabled={false} />);
    expect(screen.getByTestId('icon-wifi-off')).toBeInTheDocument();
  });

  it('shows wifi-off icon when not connected', () => {
    render(<MarkdownHeader {...defaultProps} isConnected={false} />);
    expect(screen.getByTestId('icon-wifi-off')).toBeInTheDocument();
  });

  it('hides TOC toggle button when TOC is empty', () => {
    render(<MarkdownHeader {...defaultProps} toc={[]} />);
    expect(screen.queryByTestId('icon-list')).not.toBeInTheDocument();
  });
});
