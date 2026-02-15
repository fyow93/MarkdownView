'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types
export interface FileTab {
  path: string;
  name: string;
  isActive: boolean;
}

interface FileContextType {
  // State
  selectedFile: string;
  openTabs: FileTab[];
  refreshKey: number;
  
  // Actions
  selectFile: (filePath: string) => void;
  openFile: (filePath: string) => void;
  closeTab: (filePath: string) => void;
  refreshFileTree: () => void;
}

const FileContext = createContext<FileContextType | null>(null);

// Provider props
interface FileProviderProps {
  children: ReactNode;
}

// Storage key constants
const STORAGE_KEYS = {
  SELECTED_FILE: 'last-selected-file',
  OPEN_TABS: 'markdown-viewer-tabs',
} as const;

// Helper to get file name from path
const getFileName = (filePath: string): string => {
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
};

export function FileProvider({ children }: FileProviderProps) {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [openTabs, setOpenTabs] = useState<FileTab[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load initial state from localStorage
  React.useEffect(() => {
    try {
      const savedFile = localStorage.getItem(STORAGE_KEYS.SELECTED_FILE);
      const savedTabs = localStorage.getItem(STORAGE_KEYS.OPEN_TABS);
      
      if (savedTabs) {
        try {
          const tabs = JSON.parse(savedTabs) as FileTab[];
          setOpenTabs(tabs);
        } catch {
          // Invalid JSON, ignore
        }
      }
      
      if (savedFile) {
        setSelectedFile(savedFile);
      }
    } catch {
      // localStorage not available (e.g., private browsing mode), ignore
    }
  }, []);

  // Select a file (switch active tab)
  const selectFile = useCallback((filePath: string) => {
    setSelectedFile(filePath);
    localStorage.setItem(STORAGE_KEYS.SELECTED_FILE, filePath);
    
    // Update tab active states
    setOpenTabs(prev => 
      prev.map(tab => ({
        ...tab,
        isActive: tab.path === filePath
      }))
    );
  }, []);

  // Open a file (add to tabs if not exists, then select)
  const openFile = useCallback((filePath: string) => {
    setOpenTabs(prev => {
      const exists = prev.some(tab => tab.path === filePath);
      
      if (exists) {
        // Update active state
        const updated = prev.map(tab => ({
          ...tab,
          isActive: tab.path === filePath
        }));
        localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(updated));
        return updated;
      }
      
      // Add new tab
      const newTab: FileTab = {
        path: filePath,
        name: getFileName(filePath),
        isActive: true
      };
      
      const updated = [
        ...prev.map(tab => ({ ...tab, isActive: false })),
        newTab
      ];
      
      localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(updated));
      return updated;
    });
    
    setSelectedFile(filePath);
    localStorage.setItem(STORAGE_KEYS.SELECTED_FILE, filePath);
  }, []);

  // Close a tab
  const closeTab = useCallback((filePath: string) => {
    setOpenTabs(prev => {
      const tabIndex = prev.findIndex(tab => tab.path === filePath);
      if (tabIndex === -1) return prev;
      
      const wasActive = prev[tabIndex].isActive;
      const updated = prev.filter(tab => tab.path !== filePath);
      
      // If closing active tab, activate adjacent tab
      if (wasActive && updated.length > 0) {
        const newActiveIndex = Math.min(tabIndex, updated.length - 1);
        updated[newActiveIndex].isActive = true;
        
        setSelectedFile(updated[newActiveIndex].path);
        localStorage.setItem(STORAGE_KEYS.SELECTED_FILE, updated[newActiveIndex].path);
      } else if (updated.length === 0) {
        setSelectedFile('');
        localStorage.removeItem(STORAGE_KEYS.SELECTED_FILE);
      }
      
      localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Refresh file tree
  const refreshFileTree = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const value: FileContextType = {
    selectedFile,
    openTabs,
    refreshKey,
    selectFile,
    openFile,
    closeTab,
    refreshFileTree,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
}

// Hook to use file context
export function useFileContext(): FileContextType {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
}

// Export individual selectors for performance
export function useSelectedFile(): string {
  const { selectedFile } = useFileContext();
  return selectedFile;
}

export function useOpenTabs(): FileTab[] {
  const { openTabs } = useFileContext();
  return openTabs;
}
