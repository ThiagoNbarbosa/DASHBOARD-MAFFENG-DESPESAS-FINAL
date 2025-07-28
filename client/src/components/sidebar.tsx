import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import { useResponsive } from "@/hooks/use-responsive";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BarChart3, FileText, TrendingUp, LogOut, Menu, X, UserPlus, Receipt, Calculator, CreditCard, Download, Settings, Building, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SignupModal from "@/components/signup-modal";
// Logo MAFFENG
const MAFFENGLogo = () => (
  <img src="/logo-maffeng.svg" alt="MAFFENG Logo" className="h-full w-full object-contain" />
);

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMobile, isTablet } = useResponsive();
  const mobileHelper = useIsMobile();
  const overlayRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar on mobile when navigating (prevents white screen)
  useEffect(() => {
    if (isMobile || mobileHelper) {
      setIsOpen(false);
    }
  }, [location, isMobile, mobileHelper]);

  // Close sidebar when clicking outside on mobile
  const handleOutsideClick = useCallback((event: Event) => {
    if (
      overlayRef.current &&
      sidebarRef.current &&
      event.target &&
      !sidebarRef.current.contains(event.target as Node) &&
      (isMobile || mobileHelper)
    ) {
      setIsOpen(false);
    }
  }, [isMobile, mobileHelper]);

  useEffect(() => {
    if (isOpen && (isMobile || mobileHelper)) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      
      // Prevent body scroll when mobile sidebar is open
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('touchstart', handleOutsideClick);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, isMobile, mobileHelper, handleOutsideClick]);

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      toast({
        title: "Logout realizado com sucesso",
        description: "Até logo!",
      });
    },
  });

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: BarChart3,
      current: location === "/",
      description: "Visão geral financeira"
    },
    {
      name: "Despesas",
      href: "/despesas",
      icon: CreditCard,
      current: location === "/despesas",
      description: "Gestão de gastos"
    },
    {
      name: "Faturamento",
      href: "/faturamento",
      icon: Receipt,
      current: location === "/faturamento",
      description: "Gestão de receitas"
    },
    {
      name: "Relatórios",
      href: "/relatorios",
      icon: Download,
      current: location === "/relatorios",
      description: "Exportar dados filtrados"
    },
    ...(user?.role === "admin" ? [{
      name: "Resultados",
      href: "/results",
      icon: TrendingUp,
      current: location === "/results",
      description: "Analytics avançados"
    }, {
      name: "Final",
      href: "/final",
      icon: Calculator,
      current: location === "/final",
      description: "Lucro e balanço"
    }] : [])
  ];

  const handleNavigation = (href: string) => {
    console.log('Navigating to:', href);
    
    // Close mobile menu first
    if (isMobile || mobileHelper) {
      setIsOpen(false);
    }
    
    // Use direct navigation
    setLocation(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white shadow-md border-gray-200"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          ref={overlayRef}
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-14 flex items-center justify-center mr-3">
                <MAFFENGLogo />
              </div>
              <span className="text-lg font-semibold text-gray-900">Despesas</span>
            </div>
          </div>

          {/* Navigation with scroll */}
          <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto" style={{ height: 'calc(100vh - 8rem)' }}>
            <div className="space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    item.current
                      ? "bg-orange-50 text-orange-700 border border-orange-200 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-colors ${
                    item.current ? "text-orange-600" : "text-gray-500 group-hover:text-gray-700"
                  }`} />
                  <div className="flex flex-col items-start">
                    <span>{item.name}</span>
                    {item.description && (
                      <span className="text-xs text-gray-500 mt-0.5">{item.description}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {user?.role === "admin" && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2 px-3">ADMINISTRAÇÃO</p>
                <div className="space-y-2">
                  <SignupModal />
                  <button
                    onClick={() => handleNavigation("/configuracoes")}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                      location === "/configuracoes"
                        ? "bg-orange-50 text-orange-700 border border-orange-200 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                    }`}
                  >
                    <Settings className={`mr-3 h-5 w-5 transition-colors ${
                      location === "/configuracoes" ? "text-orange-600" : "text-gray-500 group-hover:text-gray-700"
                    }`} />
                    <div className="flex flex-col items-start">
                      <span>Configurações</span>
                      <span className="text-xs text-gray-500 mt-0.5">Contratos e categorias</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
