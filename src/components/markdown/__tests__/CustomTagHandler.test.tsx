/**
 * Tests for Custom Tag Handler
 * 
 * TDD RED Phase: Tests for handling unknown/custom XML tags in markdown
 * 
 * Problem: Markdown content may contain custom XML-like tags (e.g., <overview>, <details>)
 * that are not valid HTML and cause React warnings about unrecognized elements.
 * 
 * Solution: Create a handler that wraps unknown tags in valid HTML elements.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  isCustomXmlTag, 
  CustomTagWrapper,
  KNOWN_HTML_TAGS,
} from '../CustomTagHandler';

describe('isCustomXmlTag', () => {
  it('should return true for custom/unknown tags', () => {
    expect(isCustomXmlTag('overview')).toBe(true);
    expect(isCustomXmlTag('thinking')).toBe(true);
    expect(isCustomXmlTag('plan')).toBe(true);
    expect(isCustomXmlTag('my-custom-tag')).toBe(true);
    expect(isCustomXmlTag('antml')).toBe(true);
  });

  it('should return false for known HTML tags', () => {
    expect(isCustomXmlTag('div')).toBe(false);
    expect(isCustomXmlTag('span')).toBe(false);
    expect(isCustomXmlTag('p')).toBe(false);
    expect(isCustomXmlTag('h1')).toBe(false);
    expect(isCustomXmlTag('table')).toBe(false);
    expect(isCustomXmlTag('a')).toBe(false);
    expect(isCustomXmlTag('img')).toBe(false);
  });

  it('should return false for React component names (uppercase)', () => {
    expect(isCustomXmlTag('Overview')).toBe(false);
    expect(isCustomXmlTag('MyComponent')).toBe(false);
  });

  it('should handle empty or invalid input', () => {
    expect(isCustomXmlTag('')).toBe(false);
  });
});

describe('KNOWN_HTML_TAGS', () => {
  it('should include common HTML elements', () => {
    expect(KNOWN_HTML_TAGS.has('div')).toBe(true);
    expect(KNOWN_HTML_TAGS.has('span')).toBe(true);
    expect(KNOWN_HTML_TAGS.has('p')).toBe(true);
    expect(KNOWN_HTML_TAGS.has('a')).toBe(true);
    expect(KNOWN_HTML_TAGS.has('img')).toBe(true);
    expect(KNOWN_HTML_TAGS.has('table')).toBe(true);
  });

  it('should include semantic HTML5 elements', () => {
    expect(KNOWN_HTML_TAGS.has('article')).toBe(true);
    expect(KNOWN_HTML_TAGS.has('section')).toBe(true);
    expect(KNOWN_HTML_TAGS.has('header')).toBe(true);
    expect(KNOWN_HTML_TAGS.has('footer')).toBe(true);
    expect(KNOWN_HTML_TAGS.has('nav')).toBe(true);
    expect(KNOWN_HTML_TAGS.has('aside')).toBe(true);
  });

  it('should include details and summary (valid HTML5)', () => {
    // details and summary ARE valid HTML5 elements
    expect(KNOWN_HTML_TAGS.has('details')).toBe(true);
    expect(KNOWN_HTML_TAGS.has('summary')).toBe(true);
  });
});

describe('CustomTagWrapper', () => {
  it('should render custom tags as div with data-custom-tag attribute', () => {
    render(
      <CustomTagWrapper tagName="overview">
        Test content
      </CustomTagWrapper>
    );

    const element = screen.getByText('Test content');
    expect(element).toBeInTheDocument();
    expect(element.getAttribute('data-custom-tag')).toBe('overview');
    expect(element.tagName.toLowerCase()).toBe('div');
  });

  it('should preserve children content', () => {
    render(
      <CustomTagWrapper tagName="thinking">
        <p>Nested paragraph</p>
        <span>Nested span</span>
      </CustomTagWrapper>
    );

    expect(screen.getByText('Nested paragraph')).toBeInTheDocument();
    expect(screen.getByText('Nested span')).toBeInTheDocument();
  });

  it('should apply custom className if provided', () => {
    render(
      <CustomTagWrapper tagName="plan" className="custom-class">
        Content
      </CustomTagWrapper>
    );

    const element = screen.getByText('Content');
    expect(element).toHaveClass('custom-class');
  });

  it('should have default styling classes', () => {
    render(
      <CustomTagWrapper tagName="overview">
        Content
      </CustomTagWrapper>
    );

    const element = screen.getByText('Content');
    // Should have some visual distinction for custom tags
    expect(element.className).toContain('custom-xml-tag');
  });
});
