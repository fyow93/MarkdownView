'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface SearchContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  onFileSelect: ((sessionId: string, relativePath: string) => void) | null;
  setOnFileSelect: (callback: ((sessionId: string, relativePath: string) => void) | null) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [onFileSelectCallback, setOnFileSelectCallback] = useState<((sessionId: string, relativePath: string) => void) | null>(null);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  const setOnFileSelect = useCallback((callback: ((sessionId: string, relativePath: string) => void) | null) => {
    setOnFileSelectCallback(() => callback);
  }, []);

  return (
    <SearchContext.Provider value={{ open, setOpen, toggle, onFileSelect: onFileSelectCallback, setOnFileSelect }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
