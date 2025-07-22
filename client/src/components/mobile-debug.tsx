import React, { useEffect, useState } from 'react';
import { useResponsive } from '@/hooks/use-responsive';

// Componente para detectar e reportar problemas mobile
export function MobileDebugger() {
  const { isMobile, windowSize } = useResponsive();
  const [errors, setErrors] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<string[]>([]);

  useEffect(() => {
    if (!isMobile) return;

    const handleError = (event: ErrorEvent) => {
      const errorInfo = `${new Date().toISOString()}: ${event.message} at ${event.filename}:${event.lineno}`;
      setErrors(prev => [...prev.slice(-9), errorInfo]);
      console.error('MOBILE ERROR DETECTED:', errorInfo);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo = `${new Date().toISOString()}: Promise rejection - ${event.reason}`;
      setErrors(prev => [...prev.slice(-9), errorInfo]);
      console.error('MOBILE PROMISE REJECTION:', errorInfo);
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const interaction = `${new Date().toISOString()}: Click on ${target.tagName} ${target.className}`;
      setInteractions(prev => [...prev.slice(-19), interaction]);
      
      // Detectar cliques em elementos problemáticos
      if (target.closest('[role="combobox"]') || target.closest('[data-radix-select-trigger]')) {
        console.warn('MOBILE SELECT INTERACTION:', interaction);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('click', handleClick);
    };
  }, [isMobile]);

  // Só mostrar em desenvolvimento e mobile
  if (!isMobile || process.env.NODE_ENV === 'production') return null;

  return (
    <div 
      className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded max-w-xs max-h-32 overflow-y-auto z-[999]"
      style={{ fontSize: '10px' }}
    >
      <div className="font-bold mb-1">Mobile Debug</div>
      <div>Size: {windowSize.width}x{windowSize.height}</div>
      {errors.length > 0 && (
        <div className="mt-1">
          <div className="font-semibold text-red-300">Errors:</div>
          {errors.slice(-3).map((error, i) => (
            <div key={i} className="truncate">{error}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MobileDebugger;