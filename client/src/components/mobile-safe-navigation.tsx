import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileSafeNavigationProps {
  onNavigationStart?: () => void;
  onNavigationComplete?: () => void;
  onNavigationError?: (error: Error) => void;
}

export function MobileSafeNavigation({
  onNavigationStart,
  onNavigationComplete,
  onNavigationError
}: MobileSafeNavigationProps) {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();

  // Safe navigation wrapper for mobile devices
  const safeNavigate = useCallback((path: string) => {
    if (!isMobile) {
      setLocation(path);
      return;
    }

    try {
      onNavigationStart?.();

      // Add a small delay for mobile to ensure proper state cleanup
      setTimeout(() => {
        try {
          setLocation(path);
          
          // Wait for navigation to complete, then trigger callback
          setTimeout(() => {
            onNavigationComplete?.();
          }, 100);
        } catch (error) {
          console.error('Navigation error:', error);
          onNavigationError?.(error as Error);
        }
      }, 50);
    } catch (error) {
      console.error('Safe navigation error:', error);
      onNavigationError?.(error as Error);
    }
  }, [isMobile, setLocation, onNavigationStart, onNavigationComplete, onNavigationError]);

  // Handle browser back/forward buttons on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handlePopState = (event: PopStateEvent) => {
      try {
        // Prevent default browser behavior that might cause white screens
        event.preventDefault();
        
        // Force a controlled navigation
        const newPath = window.location.pathname;
        safeNavigate(newPath);
      } catch (error) {
        console.error('PopState navigation error:', error);
        onNavigationError?.(error as Error);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isMobile, safeNavigate, onNavigationError]);

  // Monitor for failed navigations and provide recovery
  useEffect(() => {
    if (!isMobile) return;

    const checkNavigationHealth = () => {
      const body = document.body;
      const hasValidContent = body.children.length > 1 && body.scrollHeight > 100;
      
      if (!hasValidContent && document.readyState === 'complete') {
        console.warn('Potential navigation failure detected, attempting recovery');
        
        // Try to recover by reloading current route
        try {
          window.location.reload();
        } catch (error) {
          console.error('Recovery failed:', error);
          onNavigationError?.(error as Error);
        }
      }
    };

    // Check navigation health after route changes
    const timeout = setTimeout(checkNavigationHealth, 2000);
    
    return () => clearTimeout(timeout);
  }, [location, isMobile, onNavigationError]);

  return null; // This is a utility component, doesn't render anything
}

export default MobileSafeNavigation;