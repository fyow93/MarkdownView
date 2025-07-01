'use client';

import { useEffect, useState } from 'react';

// Stagewise工具栏包装组件
export default function StagewiseToolbarWrapper() {
  const [StagewiseToolbar, setStagewiseToolbar] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 只在开发环境下加载
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    setIsLoading(true);

    // 动态导入Stagewise工具栏
    const loadStagewiseToolbar = async () => {
      try {
        // 先尝试使用@stagewise-plugins/react（更基础的包）
        const module = await import('@stagewise-plugins/react') as any;
        if (module.StagewiseToolbar) {
          setStagewiseToolbar(() => module.StagewiseToolbar);
          console.log('Stagewise toolbar loaded successfully from @stagewise-plugins/react');
        } else if (module.default) {
          setStagewiseToolbar(() => module.default);
          console.log('Stagewise toolbar loaded successfully (default export)');
        } else {
          throw new Error('No StagewiseToolbar component found in module');
        }
      } catch (err) {
        console.warn('Failed to load Stagewise toolbar from @stagewise-plugins/react:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // 尝试其他导入方式
        try {
          const fallbackModule = await import('@stagewise/toolbar-next') as any;
          if (fallbackModule.StagewiseToolbar) {
            setStagewiseToolbar(() => fallbackModule.StagewiseToolbar);
            console.log('Stagewise toolbar loaded from fallback (@stagewise/toolbar-next)');
          }
        } catch (fallbackErr) {
          console.warn('All Stagewise toolbar imports failed:', fallbackErr);
          // 最后尝试@stagewise/toolbar
          try {
            const lastResortModule = await import('@stagewise/toolbar') as any;
            if (lastResortModule.StagewiseToolbar || lastResortModule.default) {
              setStagewiseToolbar(() => lastResortModule.StagewiseToolbar || lastResortModule.default);
              console.log('Stagewise toolbar loaded from last resort (@stagewise/toolbar)');
            }
          } catch (finalErr) {
            console.error('All attempts to load Stagewise toolbar failed:', finalErr);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadStagewiseToolbar();
  }, []);

  // 生产环境下不渲染
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // 加载中状态
  if (isLoading) {
    return null;
  }

  // 如果有错误且没有成功加载组件，显示错误信息（仅在控制台）
  if (error && !StagewiseToolbar) {
    console.error('Stagewise Toolbar Error:', error);
    return null;
  }

  // 如果成功加载了组件，渲染它
  if (StagewiseToolbar) {
    return <StagewiseToolbar />;
  }

  // 默认状态
  return null;
} 