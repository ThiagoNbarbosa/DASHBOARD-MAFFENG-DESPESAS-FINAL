import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Inicializar com valor padrão para evitar hydration mismatch
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
      }
    };

    // Verificar imediatamente
    checkMobile();

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", checkMobile);
    
    // Listener adicional para resize (backup)
    window.addEventListener('resize', checkMobile);

    return () => {
      mql.removeEventListener("change", checkMobile);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);

  return isMobile;
}
