'use client';

import React, { memo } from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { 
  RefreshCw, 
  Clock, 
  Wifi, 
  WifiOff, 
  MapPin, 
  List,
  FileText
} from 'lucide-react';
import type { TocItem } from './LeftSideToc';

interface MarkdownHeaderProps {
  filePath?: string;
  toc: TocItem[];
  showToc: boolean;
  setShowToc: (show: boolean) => void;
  lastUpdateTime: string | null;
  isRealTimeEnabled: boolean;
  setIsRealTimeEnabled: (enabled: boolean) => void;
  isConnected: boolean;
  onClearScroll: () => void;
  onRefresh: () => void;
}

const MarkdownHeader: React.FC<MarkdownHeaderProps> = memo(({
  filePath,
  toc,
  showToc,
  setShowToc,
  lastUpdateTime,
  isRealTimeEnabled,
  setIsRealTimeEnabled,
  isConnected,
  onClearScroll,
  onRefresh
}) => {
  const t = useTranslations('Markdown');
  const tNav = useTranslations('Navigation');

  return (
    <CardHeader className="border-b bg-linear-to-r from-primary/5 to-primary/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {toc.length > 0 && (
            <Button
              onClick={() => setShowToc(!showToc)}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <List className="h-4 w-4" />
              {showToc ? tNav('hideToc') : tNav('showToc')}
            </Button>
          )}
          <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg truncate">{filePath ? filePath.split('/').pop() : ''}</CardTitle>
            {lastUpdateTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>{t('updatedAt')} {lastUpdateTime}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            variant="ghost"
            size="sm"
            className={`${isRealTimeEnabled && isConnected ? 'text-green-600' : 'text-muted-foreground'}`}
            title={isRealTimeEnabled ? (isConnected ? t('realtimeEnabled') : t('realtimeConnecting')) : t('realtimeDisabled')}
          >
            {isRealTimeEnabled && isConnected ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
          </Button>
          <Button 
            onClick={onClearScroll} 
            variant="ghost" 
            size="sm"
            title={t('clearScrollPosition')}
          >
            <MapPin className="h-4 w-4" />
          </Button>

          <Button onClick={onRefresh} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardHeader>
  );
});

MarkdownHeader.displayName = 'MarkdownHeader';

export default MarkdownHeader;
