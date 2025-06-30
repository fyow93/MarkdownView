'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, Star, Loader2 } from 'lucide-react';

interface GitHubStarProps {
  repoUrl: string;
  className?: string;
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

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        setStarCount(data.stargazers_count);
      } catch (err) {
        console.error('Failed to fetch star count:', err);
        setError('Failed to load stars');
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