import { useState, useEffect, useCallback } from 'react';

export function useResponsive() {
  // Inicializar com valores padrão para evitar hydration issues
  const [state, setState] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;
      return {
        windowSize: { width, height },
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
      };
    }
    return {
      windowSize: { width: 0, height: 0 },
      isMobile: false,
      isTablet: false,
    };
  });

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setState(prev => {
      const newIsMobile = width < 640;
      const newIsTablet = width >= 640 && width < 1024;
      
      // Só atualizar se houve mudança significativa
      if (
        prev.windowSize.width !== width ||
        prev.windowSize.height !== height ||
        prev.isMobile !== newIsMobile ||
        prev.isTablet !== newIsTablet
      ) {
        return {
          windowSize: { width, height },
          isMobile: newIsMobile,
          isTablet: newIsTablet,
        };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    // Verificar tamanho inicial
    handleResize();

    // Debounce para evitar muitas re-renderizações
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
    };
  }, [handleResize]);

  return {
    ...state,
    isDesktop: !state.isMobile && !state.isTablet,
  };
}