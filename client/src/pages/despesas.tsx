import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import { AllExpensesTable } from "@/components/all-expenses-table";
import { ModernFilters } from "@/components/ui/modern-filters";
import ExpenseModal from "@/components/expense-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading-spinner";
import { FileText, TrendingUp, Calendar, Receipt, Filter } from "lucide-react";
import { FORMAS_PAGAMENTO } from "@shared/constants";
import { useContractsAndCategories } from "@/hooks/use-contracts-categories";

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

  const handleFilterChange = (newFilters: Partial<Record<string, string>>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  // Hook para buscar contratos e categorias completos (constantes + dinâmicos)
  const { data: contractsAndCategories } = useContractsAndCategories();

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

        {/* Filtros */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4">
          <ModernFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            filterOptions={[
              {
                key: "year",
                label: "Ano",
                placeholder: "Selecione o ano",
                options: [
                  { value: "all", label: "Todos os anos" },
                  { value: "2024", label: "2024" },
                  { value: "2025", label: "2025" },
                  { value: "2026", label: "2026" }
                ]
              },
              {
                key: "month",
                label: "Mês",  
                placeholder: "Todos os meses",
                options: [
                  { value: "all", label: "Todos os meses" },
                  ...Array.from({ length: 12 }, (_, i) => {
                    const monthNumber = String(i + 1).padStart(2, '0');
                    const monthName = new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'long' });
                    return { value: monthNumber, label: monthName };
                  })
                ]
              },
              {
                key: "category",
                label: "Categoria",
                placeholder: "Todas as categorias", 
                options: [
                  { value: "all", label: "Todas as categorias" },
                  ...(contractsAndCategories?.categories || []).map(category => ({ value: category, label: category }))
                ]
              },
              {
                key: "paymentMethod",
                label: "Forma de Pagamento",
                placeholder: "Todas as formas",
                options: [
                  { value: "all", label: "Todas as formas" },
                  ...FORMAS_PAGAMENTO.map(method => ({ value: method, label: method }))
                ]
              },
              ...(user?.role === "admin" ? [{
                key: "contractNumber" as const,
                label: "Contrato",
                placeholder: "Todos os contratos",
                options: [
                  { value: "all", label: "Todos os contratos" },
                  ...(contractsAndCategories?.contracts || []).map(contract => ({ value: contract, label: contract }))
                ]
              }] : [])
            ]}
            searchPlaceholder="Buscar por item, categoria, contrato ou forma de pagamento..."
            showExport={false}
            title="Filtros de Despesas"
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