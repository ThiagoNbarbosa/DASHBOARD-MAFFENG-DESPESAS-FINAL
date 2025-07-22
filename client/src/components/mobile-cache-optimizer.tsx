import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';

export function MobileCacheOptimizer() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) return;

    // Aggressive cache management for mobile devices
    const optimizeCache = () => {
      // Clear old queries to free memory
      queryClient.getQueryCache().getAll().forEach(query => {
        const isStale = Date.now() - query.state.dataUpdatedAt > 10 * 60 * 1000; // 10 minutes
        if (isStale) {
          queryClient.removeQueries({ queryKey: query.queryKey });
        }
      });

      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
    };

    // Run optimization every 5 minutes on mobile
    const interval = setInterval(optimizeCache, 5 * 60 * 1000);

    // Optimize on visibility change (when app becomes visible again)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(optimizeCache, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial optimization
    setTimeout(optimizeCache, 2000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMobile, queryClient]);

  // Monitor memory usage on mobile
  useEffect(() => {
    if (!isMobile || !('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
      
      // If memory usage is high, clear unnecessary cache
      if (usedMB > limitMB * 0.8) {
        console.warn('High memory usage detected, clearing cache');
        queryClient.clear();
      }
    };

    const memoryCheck = setInterval(checkMemory, 30000); // Check every 30 seconds

    return () => clearInterval(memoryCheck);
  }, [isMobile, queryClient]);

  return null;
}

export default MobileCacheOptimizer;