'use client';

import * as React from 'react';
import { Search, Loader2, FileText, CornerDownLeft, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SearchResult } from '@/lib/search';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSessionId?: string;
  onFileSelect?: (sessionId: string, relativePath: string) => void;
}

const RECENT_SEARCHES_KEY = 'recent-searches';
const MAX_RECENT_SEARCHES = 10;

export function SearchDialog({ open, onOpenChange, defaultSessionId, onFileSelect }: SearchDialogProps) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setSelectedIndex(0);
        return;
      }

      setIsLoading(true);
      setError(null);
      setSelectedIndex(0);

      try {
        const params = new URLSearchParams();
        params.set('q', query);
        if (defaultSessionId) {
          params.set('sessionId', defaultSessionId);
        }

        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) throw new Error('Search failed');
        
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
        } else {
          setError(data.error);
        }
      } catch {
        setError('Failed to perform search');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, defaultSessionId]);

  const displayResults = query.trim().length === 0 ? [] : results;

  const handleSelect = (result: SearchResult) => {
    const searches = recentSearches.filter(s => s !== query);
    const updated = [query, ...searches].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    setRecentSearches(updated);

    onOpenChange(false);
    onFileSelect?.(result.sessionId, result.file.relativePath);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, displayResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && displayResults.length > 0) {
      e.preventDefault();
      handleSelect(displayResults[selectedIndex]);
    }
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="sr-only">Search Files</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search in files..."
              className="border-0 focus-visible:ring-0 px-0 h-auto text-base bg-transparent shadow-none"
              autoFocus
            />
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </DialogHeader>
        
        {error && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 text-center">
            {error}
          </div>
        )}

        <ScrollArea className="h-[400px] max-h-[50vh]" ref={scrollAreaRef}>
          {query.trim().length === 0 && recentSearches.length > 0 && (
            <div className="p-4 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                <Clock className="w-3 h-3" />
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearch(search)}
                  className="w-full text-left p-2 rounded text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          )}

          {query.trim().length === 0 && recentSearches.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Start typing to search files...
            </div>
          )}
          
          {displayResults.length === 0 && query.length >= 2 && !isLoading && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          )}
          
          {displayResults.length > 0 && (
            <div className="p-2 space-y-2">
              {displayResults.map((result, index) => (
                <button
                  key={`${result.sessionId}-${result.file.path}-${index}`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedIndex === index
                      ? 'bg-muted/80'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {result.file.relativePath}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto bg-muted px-1.5 py-0.5 rounded">
                      {result.sessionId.substring(0, 8)}
                    </span>
                  </div>
                  
                  {result.matches.slice(0, 2).map((match, i) => (
                    <div key={i} className="text-xs text-muted-foreground pl-6 border-l-2 border-muted ml-2 mt-1 line-clamp-1 font-mono">
                      <span className="mr-2 opacity-50">L{match.line}</span>
                      <span dangerouslySetInnerHTML={{ 
                        __html: match.preview.replace(
                          new RegExp(`(${query})`, 'gi'), 
                          '<span class="text-foreground font-medium bg-yellow-500/20">$1</span>'
                        ) 
                      }} />
                    </div>
                  ))}
                </button>
              ))}
            </div>
          )}
          
          <div className="p-2 text-xs text-muted-foreground text-center border-t mt-2 flex items-center justify-center gap-1">
            <CornerDownLeft className="w-3 h-3" /> to select • Use ↑↓ to navigate
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
