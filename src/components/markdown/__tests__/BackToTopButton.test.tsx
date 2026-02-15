/**
 * Tests for BackToTopButton component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackToTopButton } from '../BackToTopButton';

describe('BackToTopButton', () => {
  it('should not render when not visible', () => {
    const { container } = render(
      <BackToTopButton visible={false} onClick={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when visible', () => {
    render(<BackToTopButton visible={true} onClick={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<BackToTopButton visible={true} onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should have accessible label', () => {
    render(<BackToTopButton visible={true} onClick={() => {}} />);
    expect(screen.getByLabelText('Back to top')).toBeInTheDocument();
  });

  it('should use custom label', () => {
    render(
      <BackToTopButton 
        visible={true} 
        onClick={() => {}} 
        label="回到顶部" 
      />
    );
    expect(screen.getByLabelText('回到顶部')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <BackToTopButton 
        visible={true} 
        onClick={() => {}} 
        className="custom-class" 
      />
    );
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
