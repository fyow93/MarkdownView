'use client';

import React, { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Folder,
  ArrowLeft,
  Home,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  FileText
} from 'lucide-react';

interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isReadable: boolean;
}

interface DirectorySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectorySelect: (path: string) => void;
}

export const DirectorySelector: React.FC<DirectorySelectorProps> = ({ 
  isOpen, 
  onClose, 
  onDirectorySelect
}) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{name: string, path: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualPath, setManualPath] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [applying, setApplying] = useState(false);
  const locale = useLocale();
  const t = useTranslations('FileTree');

  // 获取当前项目根目录
  const fetchCurrentDirectory = async () => {
    try {
      const response = await fetch(`/${locale}/api/config/project-root`);
      if (response.ok) {
        const data = await response.json();
        setManualPath(data.projectRoot || '');
      }
    } catch (error) {
      console.error('Failed to fetch current directory:', error);
    }
  };

  // 浏览目录
  const browseDirectory = async (path?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = path 
        ? `/${locale}/api/directories?path=${encodeURIComponent(path)}`
        : `/${locale}/api/directories`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setCurrentPath(data.currentPath || '');
        setDirectories(data.items || []);
        setBreadcrumbs(data.breadcrumbs || []);
      } else {
        setError(data.error || t('error'));
      }
    } catch (err) {
      setError(t('error'));
      console.error('Failed to browse directory:', err);
    } finally {
      setLoading(false);
    }
  };

  // 应用新目录
  const applyDirectory = async (path: string) => {
    setApplying(true);
    setError(null);
    
    try {
      const response = await fetch(`/${locale}/api/config/project-root`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectRoot: path })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onDirectorySelect(path);
        onClose();
      } else {
        setError(data.error || t('changeDirectoryFailed'));
      }
    } catch (err) {
      setError(t('changeDirectoryFailed'));
      console.error('Failed to apply directory:', err);
    } finally {
      setApplying(false);
    }
  };

  // 初始化时获取当前目录和根目录列表
  useEffect(() => {
    if (isOpen) {
      fetchCurrentDirectory();
      browseDirectory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh] z-50 bg-background border-primary/20 shadow-xl">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('selectDirectory')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* 当前目录显示 */}
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">{t('currentDirectory')}</div>
            <div className="p-3 bg-muted/50 rounded-md font-mono text-sm break-all">
              {manualPath || t('loading')}
            </div>
          </div>

          {/* 切换面板 */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={!showManualInput ? "default" : "outline"}
              size="sm"
              onClick={() => setShowManualInput(false)}
            >
              <Folder className="h-4 w-4 mr-2" />
              {t('browseDirectories')}
            </Button>
            <Button
              variant={showManualInput ? "default" : "outline"}
              size="sm"
              onClick={() => setShowManualInput(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              {t('manualInput')}
            </Button>
          </div>

          {showManualInput ? (
            /* 手动输入模式 */
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('enterPath')}</label>
                <input
                  type="text"
                  value={manualPath}
                  onChange={(e) => setManualPath(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md font-mono text-sm"
                  placeholder="/path/to/your/documents"
                />
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  {t('cancel')}
                </Button>
                <Button 
                  onClick={() => applyDirectory(manualPath)}
                  disabled={!manualPath.trim() || applying}
                >
                  {applying ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {t('apply')}
                </Button>
              </div>
            </div>
          ) : (
            /* 目录浏览模式 */
            <div className="space-y-4">
              {/* 面包屑导航 */}
              {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.path}>
                      <button
                        onClick={() => browseDirectory(crumb.path)}
                        className="px-2 py-1 hover:bg-muted rounded text-primary hover:text-primary/80"
                      >
                        {crumb.name}
                      </button>
                      {index < breadcrumbs.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* 目录列表 */}
              <div className="border rounded-md max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    {t('loading')}
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-8 text-destructive">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                ) : directories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">{t('noFiles')}</div>
                  </div>
                ) : (
                                     <div className="divide-y">
                     {directories.map((dir) => (
                       <div key={dir.path} className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
                            onClick={() => browseDirectory(dir.path)}>
                         <div className="flex items-center gap-2 flex-1">
                           <Folder className="h-4 w-4 text-blue-500" />
                           <span className="text-sm">{dir.name}</span>
                         </div>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={(e) => {
                             e.stopPropagation();
                             applyDirectory(dir.path);
                           }}
                           disabled={applying}
                         >
                           {applying ? (
                             <RefreshCw className="h-3 w-3 animate-spin" />
                           ) : (
                             <Check className="h-3 w-3" />
                           )}
                         </Button>
                       </div>
                     ))}
                   </div>
                )}
              </div>

              {/* 底部操作 */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => browseDirectory()}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    {t('home')}
                  </Button>
                  {currentPath && (
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => browseDirectory(breadcrumbs[breadcrumbs.length - 2]?.path)}
                      disabled={breadcrumbs.length <= 1}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {t('back')}
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    {t('cancel')}
                  </Button>
                  {currentPath && (
                    <Button 
                      onClick={() => applyDirectory(currentPath)}
                      disabled={applying}
                    >
                      {applying ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      {t('apply')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}; 