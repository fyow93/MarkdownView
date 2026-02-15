'use client';

import * as React from 'react';
import { SearchDialog } from './SearchDialog';
import { useSearch } from '@/contexts/SearchContext';

export function SearchDialogWrapper() {
  const { open, setOpen, toggle, onFileSelect } = useSearch();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggle]);

  return <SearchDialog open={open} onOpenChange={setOpen} onFileSelect={onFileSelect ?? undefined} />;
}
