'use client';

import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

/** Length of random ID suffix for unique mermaid element IDs */
const RANDOM_ID_LENGTH = 9;

interface MermaidChartProps {
  chart: string;
}

/**
 * Actual Mermaid chart rendering component
 */
export const MermaidChart: React.FC<MermaidChartProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    const renderChart = async () => {
      try {
        setIsLoading(true);
        setError('');
        setSvg('');
        
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 2 + RANDOM_ID_LENGTH)}`;
        
        const result = await mermaid.render(id, chart);
        
        if (isMounted) {
          setSvg(result.svg);
          setIsLoading(false);
        }
      } catch (err) {
        logger.error('Mermaid rendering error:', err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(`Chart rendering failed: ${errorMessage}`);
          setIsLoading(false);
        }
      }
    };

    renderChart();
    
    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <Card className="my-6 border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-destructive text-base">
            <AlertCircle className="h-4 w-4" />
            Mermaid Chart Rendering Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="bg-muted/50 p-3 rounded-md">
            <pre className="text-xs overflow-x-auto">
              <code>{chart}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !svg) {
    return (
      <Card className="my-6 bg-muted/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
            <span className="text-sm text-muted-foreground">Rendering chart...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-6 bg-linear-to-br from-background to-muted/20 border-primary/20">
      <CardContent className="p-6">
        <div 
          className="mermaid-chart flex justify-center"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svg, { ADD_TAGS: ['foreignObject'] }) }}
        />
      </CardContent>
    </Card>
  );
};

/**
 * Lazy-loaded Mermaid chart component with Intersection Observer
 */
export const LazyMermaidChart: React.FC<MermaidChartProps> = ({ chart }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setTimeout(() => setShouldRender(true), 100);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.1
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!shouldRender) {
    return (
      <div ref={elementRef}>
        <Card className="my-6 bg-muted/10 border-dashed border-2 border-muted">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
              <span className="text-sm text-muted-foreground">
                {isVisible ? 'Loading chart...' : 'Chart pending'}
              </span>
              <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="mt-4 flex justify-center">
              <div className="bg-muted/50 px-3 py-1 rounded text-xs text-muted-foreground">
                Mermaid Chart
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <MermaidChart chart={chart} />;
};

export default LazyMermaidChart;
