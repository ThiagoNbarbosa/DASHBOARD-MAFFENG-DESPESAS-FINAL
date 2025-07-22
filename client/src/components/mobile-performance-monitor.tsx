import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PerformanceMetrics {
  navigationStart: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  memoryUsage?: number;
  connectionType?: string;
}

interface MobilePerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  enableLogging?: boolean;
}

export function MobilePerformanceMonitor({ 
  onMetricsUpdate, 
  enableLogging = process.env.NODE_ENV === 'development' 
}: MobilePerformanceMonitorProps) {
  const isMobile = useIsMobile();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const metricsRef = useRef<PerformanceMetrics | null>(null);

  useEffect(() => {
    if (!isMobile) return;

    const collectMetrics = () => {
      try {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const newMetrics: PerformanceMetrics = {
          navigationStart: navigation.loadEventEnd,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.loadEventEnd,
        };

        // First Contentful Paint
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
          newMetrics.firstContentfulPaint = fcp.startTime;
        }

        // Memory usage (if available)
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          newMetrics.memoryUsage = memory.usedJSHeapSize;
        }

        // Connection info (if available)
        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          newMetrics.connectionType = connection.effectiveType;
        }

        metricsRef.current = newMetrics;
        setMetrics(newMetrics);
        
        if (onMetricsUpdate) {
          onMetricsUpdate(newMetrics);
        }

        if (enableLogging) {
          console.log('Mobile Performance Metrics:', {
            ...newMetrics,
            userAgent: navigator.userAgent,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn('Failed to collect performance metrics:', error);
      }
    };

    // Collect metrics after DOM is loaded
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }

    // Observer for Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if (metricsRef.current) {
            metricsRef.current.largestContentfulPaint = lastEntry.startTime;
            setMetrics({ ...metricsRef.current });
            
            if (onMetricsUpdate) {
              onMetricsUpdate(metricsRef.current);
            }
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        return () => {
          lcpObserver.disconnect();
          window.removeEventListener('load', collectMetrics);
        };
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }

    return () => {
      window.removeEventListener('load', collectMetrics);
    };
  }, [isMobile, onMetricsUpdate, enableLogging]);

  // Monitor for white screen issues
  useEffect(() => {
    if (!isMobile) return;

    const checkForWhiteScreen = () => {
      const body = document.body;
      const hasContent = body.children.length > 0 && 
                        body.offsetHeight > 0 && 
                        body.scrollHeight > 0;
      
      if (!hasContent && document.readyState === 'complete') {
        console.error('Potential white screen detected:', {
          bodyChildren: body.children.length,
          bodyHeight: body.offsetHeight,
          scrollHeight: body.scrollHeight,
          readyState: document.readyState,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        });
        
        // Try to trigger a re-render
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    };

    // Reduced checking frequency to avoid interference
    const checks = [2000];
    const timeouts = checks.map(delay => 
      setTimeout(checkForWhiteScreen, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isMobile]);

  return null; // This is a monitoring component, doesn't render anything
}

export default MobilePerformanceMonitor;