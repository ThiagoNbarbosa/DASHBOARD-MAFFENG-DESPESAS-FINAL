import { useState, useEffect } from 'react';

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(() => {
    // Inicializar com valor correto no SSR
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });
  
  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      return width >= 640 && width < 1024;
    }
    return false;
  });
  
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    }

    // Set initial size
    handleResize();

    // Add event listener with throttling para performance
    let timeoutId: NodeJS.Timeout;
    function throttledResize() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    }

    window.addEventListener('resize', throttledResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    windowSize,
  };
}