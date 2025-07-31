import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import { AllExpensesTable } from "@/components/all-expenses-table";
import { ExpenseFilters } from "@/components/expense-filters";
import MobileFilterPanel from "@/components/mobile-filter-panel";
import ExpenseModal from "@/components/expense-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading-spinner";
import { FileText, TrendingUp, Calendar, Receipt, Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { FORMAS_PAGAMENTO } from "@shared/constants";

export default function Despesas() {
  const [filters, setFilters] = useState({
    year: new Date().getFullYear().toString(),
    month: "all",
    category: "all",
    contractNumber: "all",
    paymentMethod: "all",
    startDate: "",
    endDate: "",
    search: "",
  });

  const clearFilters = () => {
    setFilters({
      year: new Date().getFullYear().toString(),
      month: "all",
      category: "all",
      contractNumber: "all",
      paymentMethod: "all",
      startDate: "",
      endDate: "",
      search: "",
    });
  };

  const isMobile = useIsMobile();

  // Calcular filtros ativos
  const calculateActiveFilters = () => {
    let count = 0;
    const currentYear = new Date().getFullYear().toString();
    
    if (filters.year !== currentYear && filters.year !== "all") count++;
    if (filters.month !== "all") count++;
    if (filters.category !== "all") count++;
    if (filters.contractNumber !== "all") count++;
    if (filters.paymentMethod !== "all") count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.search) count++;
    
    return count;
  };

  const totalFiltersActive = calculateActiveFilters();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });



  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
        
        <div className="lg:pl-64">
        {/* Header - Otimizado para Mobile */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-orange-100 p-1.5 sm:p-2 rounded-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Gestão de Despesas</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Controle total dos seus gastos empresariais
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
              <ExpenseModal />
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span className="whitespace-nowrap">{new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Informações do usuário */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Receipt className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Bem-vindo(a), {user.name}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">
                    Perfil: {user.role} • Acesso completo ao sistema de despesas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros - Responsivo */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4">
          <MobileFilterPanel
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
            user={user}
            totalFiltersActive={totalFiltersActive}
          />
        </div>

        {/* Conteúdo principal */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          <AllExpensesTable user={user as any} filters={filters} />
        </div>
      </div>

      {/* Modal de Nova Despesa */}
      <ExpenseModal />
    </div>
  );
}