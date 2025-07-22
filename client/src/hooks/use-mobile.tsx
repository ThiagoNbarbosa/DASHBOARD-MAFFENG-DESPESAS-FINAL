
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Função para verificar se é mobile
    const checkIsMobile = () => {
      try {
        return window.innerWidth < MOBILE_BREAKPOINT;
      } catch (error) {
        console.error('Erro ao verificar viewport:', error);
        return false;
      }
    };

    // Debounce para evitar muitas chamadas
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(checkIsMobile());
      }, 100);
    };

    // Verificação inicial
    setIsMobile(checkIsMobile());

    // Media query listener para melhor performance
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Adicionar listeners
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaQueryChange);
    } else {
      // Fallback para browsers mais antigos
      mediaQuery.addListener(handleMediaQueryChange);
    }

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaQueryChange);
      } else {
        mediaQuery.removeListener(handleMediaQueryChange);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return !!isMobile
}
