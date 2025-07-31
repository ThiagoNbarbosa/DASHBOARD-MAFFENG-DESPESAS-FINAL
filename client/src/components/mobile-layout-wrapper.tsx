import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

interface MobileLayoutWrapperProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function MobileLayoutWrapper({ 
  children, 
  className = '',
  loading = false,
  error = null,
  onRetry
}: MobileLayoutWrapperProps) {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);
  const [renderTimeout, setRenderTimeout] = useState<NodeJS.Timeout | null>(null);

  // Prevent white screen by ensuring content visibility
  useEffect(() => {
    if (renderTimeout) {
      clearTimeout(renderTimeout);
    }

    // Add a small delay to ensure proper rendering on mobile
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, isMobile ? 50 : 0);

    setRenderTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isMobile, children]);

  // Simplified touch handling - only prevent zoom
  useEffect(() => {
    if (!isMobile) return;

    // Prevent zoom on double tap but allow normal touch interaction
    const preventZoom = (e: TouchEvent) => {
      // Don't interfere with dialog interactions or buttons
      if (e.target && (
        (e.target as Element).closest('[role="dialog"]') ||
        (e.target as Element).closest('button') ||
        (e.target as Element).closest('[data-radix-collection-item]')
      )) {
        return;
      }
      
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventZoom, { passive: true });

    return () => {
      document.removeEventListener('touchstart', preventZoom);
    };
  }, [isMobile]);

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  }, [onRetry]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Carregando...</p>
          {isMobile && (
            <p className="text-sm text-gray-500 mt-2">Otimizando para dispositivo móvel</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Erro de Carregamento
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'Ocorreu um erro inesperado. Tente novamente.'}
          </p>
          <button
            onClick={handleRetry}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!isVisible) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-24 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${className} ${isMobile ? 'mobile-optimized' : ''} scrollable-content`}
      style={{
        minHeight: '100vh',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
        // Ensure content is always visible
        visibility: 'visible',
        position: 'relative'
      }}
    >
      {children}
    </div>
  );
}

export default MobileLayoutWrapper;