/**
 * Tests for StateComponents
 * TDD: Testing UI components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  LoadingState, 
  ErrorState, 
  EmptyState, 
  ConnectionStatus 
} from '../StateComponents';

describe('LoadingState', () => {
  it('should render with default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<LoadingState message="Fetching content..." />);
    expect(screen.getByText('Fetching content...')).toBeInTheDocument();
  });

  it('should display loading spinner', () => {
    const { container } = render(<LoadingState />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('should render error message', () => {
    render(<ErrorState error="Failed to load file" />);
    expect(screen.getByText('Failed to load file')).toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorState error="Error" onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(<ErrorState error="Error" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should use custom retry label', () => {
    render(<ErrorState error="Error" onRetry={() => {}} retryLabel="Try Again" />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('should render with default content', () => {
    render(<EmptyState />);
    expect(screen.getByText('Markdown Viewer')).toBeInTheDocument();
    expect(screen.getByText(/select a Markdown file/i)).toBeInTheDocument();
  });

  it('should render with custom title and description', () => {
    render(
      <EmptyState 
        title="Custom Title" 
        description="Custom description here" 
      />
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom description here')).toBeInTheDocument();
  });
});

describe('ConnectionStatus', () => {
  it('should show connected status when connected', () => {
    render(<ConnectionStatus isConnected={true} isEnabled={true} />);
    expect(screen.getByText('Real-time: On')).toBeInTheDocument();
  });

  it('should show disconnected status when not connected', () => {
    render(<ConnectionStatus isConnected={false} isEnabled={true} />);
    expect(screen.getByText('Real-time: Off')).toBeInTheDocument();
  });

  it('should show disconnected when disabled', () => {
    render(<ConnectionStatus isConnected={true} isEnabled={false} />);
    expect(screen.getByText('Real-time: Off')).toBeInTheDocument();
  });

  it('should call onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<ConnectionStatus isConnected={true} isEnabled={true} onToggle={onToggle} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should use custom labels', () => {
    render(
      <ConnectionStatus 
        isConnected={true} 
        isEnabled={true} 
        connectedLabel="在线"
        disconnectedLabel="离线"
      />
    );
    expect(screen.getByText('在线')).toBeInTheDocument();
  });
});
