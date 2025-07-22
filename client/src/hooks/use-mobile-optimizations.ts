import { useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

interface MobileOptimizationOptions {
  enableTouchOptimizations?: boolean;
  enableScrollOptimizations?: boolean;
  enableMemoryOptimizations?: boolean;
  enableNetworkOptimizations?: boolean;
}

export function useMobileOptimizations(options: MobileOptimizationOptions = {}) {
  const isMobile = useIsMobile();
  const {
    enableTouchOptimizations = true,
    enableScrollOptimizations = true,
    enableMemoryOptimizations = true,
    enableNetworkOptimizations = true
  } = options;

  // Touch optimizations
  useEffect(() => {
    if (!isMobile || !enableTouchOptimizations) return;

    // Prevent zoom on double tap
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Optimize touch delay
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    document.head.appendChild(meta);

    document.addEventListener('touchstart', preventZoom, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.head.removeChild(meta);
    };
  }, [isMobile, enableTouchOptimizations]);

  // Scroll optimizations
  useEffect(() => {
    if (!isMobile || !enableScrollOptimizations) return;

    // Enable momentum scrolling on iOS
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Optimize scroll performance
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-overflow-scrolling: touch;
        transform: translate3d(0, 0, 0);
      }
      
      .mobile-optimized {
        will-change: transform;
        backface-visibility: hidden;
        perspective: 1000px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.style.webkitOverflowScrolling = '';
      document.head.removeChild(style);
    };
  }, [isMobile, enableScrollOptimizations]);

  // Memory optimizations
  const optimizeMemory = useCallback(() => {
    if (!isMobile || !enableMemoryOptimizations) return;

    // Clean up unused DOM elements
    const cleanupElements = document.querySelectorAll('[data-cleanup="true"]');
    cleanupElements.forEach(el => el.remove());

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    // Clear console if too many logs
    if (console.clear && (window as any).console?.memory?.usedJSHeapSize > 50 * 1024 * 1024) {
      console.clear();
    }
  }, [isMobile, enableMemoryOptimizations]);

  // Network optimizations
  useEffect(() => {
    if (!isMobile || !enableNetworkOptimizations) return;

    // Preload critical resources
    const preloadCritical = () => {
      const criticalUrls = [
        '/api/auth/me',
        '/api/contracts-and-categories'
      ];

      criticalUrls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = 'fetch';
        link.crossOrigin = 'use-credentials';
        document.head.appendChild(link);
      });
    };

    // Prefetch on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadCritical);
    } else {
      setTimeout(preloadCritical, 100);
    }

    return () => {
      // Clean up preload links
      const preloadLinks = document.querySelectorAll('link[rel="preload"]');
      preloadLinks.forEach(link => link.remove());
    };
  }, [isMobile, enableNetworkOptimizations]);

  // Regular memory cleanup
  useEffect(() => {
    if (!isMobile || !enableMemoryOptimizations) return;

    const cleanup = setInterval(optimizeMemory, 2 * 60 * 1000); // Every 2 minutes
    
    return () => clearInterval(cleanup);
  }, [isMobile, enableMemoryOptimizations, optimizeMemory]);

  return {
    isMobile,
    optimizeMemory
  };
}

export default useMobileOptimizations;