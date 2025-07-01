'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, Star, Loader2 } from 'lucide-react';

interface GitHubStarProps {
  repoUrl: string;
  className?: string;
}

// 全局缓存，避免重复请求
const starCountCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存
const STORAGE_KEY = 'github-star-cache';

// 从 localStorage 加载缓存
const loadCacheFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      Object.entries(data).forEach(([key, value]: [string, any]) => {
        starCountCache.set(key, value);
      });
    }
  } catch (error) {
    console.warn('Failed to load GitHub star cache:', error);
  }
};

// 保存缓存到 localStorage
const saveCacheToStorage = () => {
  try {
    const data = Object.fromEntries(starCountCache);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save GitHub star cache:', error);
  }
};

// 初始化时加载缓存
if (typeof window !== 'undefined') {
  loadCacheFromStorage();
}

const GitHubStar: React.FC<GitHubStarProps> = ({ repoUrl, className = '' }) => {
  const [starCount, setStarCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从URL提取owner和repo名称
  const extractRepoInfo = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    return null;
  };

  const repoInfo = extractRepoInfo(repoUrl);

  // 获取Star数量
  useEffect(() => {
    const fetchStarCount = async () => {
      if (!repoInfo) {
        setError('Invalid GitHub URL');
        setLoading(false);
        return;
      }

      const cacheKey = `${repoInfo.owner}/${repoInfo.repo}`;
      const cached = starCountCache.get(cacheKey);
      const now = Date.now();

      // 在开发环境中，优先使用模拟数据，避免API限制
      if (process.env.NODE_ENV === 'development') {
        if (cached) {
          setStarCount(cached.count);
        } else {
          // 根据仓库名称生成模拟数据
          const mockStarCount = repoInfo.repo.length * 10 + Math.floor(Math.random() * 50);
          setStarCount(mockStarCount);
          starCountCache.set(cacheKey, { count: mockStarCount, timestamp: now });
          saveCacheToStorage();
        }
        setLoading(false);
        return;
      }

      // 检查缓存（生产环境）
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setStarCount(cached.count);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'MarkdownView-App',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 403 || response.status === 429) {
            console.warn(`GitHub API rate limited (${response.status}), using fallback`);
            if (cached) {
              setStarCount(cached.count);
            } else {
              setStarCount(100);
            }
            setError(null);
            setLoading(false);
            return;
          }
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const count = data.stargazers_count;
        
        starCountCache.set(cacheKey, { count, timestamp: now });
        saveCacheToStorage();
        setStarCount(count);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch star count:', err);
        if (cached) {
          setStarCount(cached.count);
        } else {
          setStarCount(100);
        }
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStarCount();
  }, [repoInfo]);

  // 处理Star点击
  const handleStarClick = () => {
    // 打开GitHub页面，用户需要手动star
    window.open(repoUrl, '_blank', 'noopener,noreferrer');
  };

  // 格式化数字显示
  const formatStarCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* GitHub链接按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleStarClick}
        className="gap-2 px-3 hover:bg-accent hover:text-accent-foreground"
        title="Star this repository on GitHub"
      >
        <Github className="h-4 w-4" />
        <span className="hidden sm:inline">GitHub</span>
      </Button>

      {/* Star数量显示 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleStarClick}
        className="gap-1.5 px-2.5 h-8 bg-background/95 backdrop-blur-sm border-primary/20 hover:bg-primary/5 hover:border-primary/30 transition-all"
        title={`${starCount || 0} stars on GitHub - Click to star`}
      >
        <Star className="h-3.5 w-3.5 text-amber-500" />
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : error ? (
          <span className="text-xs text-muted-foreground">--</span>
        ) : (
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-transparent border-0">
            {starCount !== null ? formatStarCount(starCount) : '0'}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default GitHubStar; 