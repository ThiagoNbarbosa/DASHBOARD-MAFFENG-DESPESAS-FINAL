import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, DollarSign, BarChart3, AlertTriangle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FinancialData {
  totalReceitas: number;
  totalDespesas: number;
  lucroLiquido: number;
  margemLucro: number;
}

export default function Final() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  // Buscar dados de faturamento
  const { data: faturamentos = [], isLoading: isLoadingBilling } = useQuery({
    queryKey: ['/api/billing'],
    queryFn: () => apiRequest('/api/billing', 'GET'),
  });

  // Buscar dados de despesas
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['/api/expenses'],
    queryFn: () => apiRequest('/api/expenses', 'GET'),
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando análise financeira...</p>
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

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular totais
  const totalReceitas = faturamentos
    .filter((f: any) => f.status === "pago")
    .reduce((sum: number, f: any) => sum + parseFloat(f.value || "0"), 0);

  const totalDespesas = expenses
    .filter((e: any) => !e.category?.startsWith('[CANCELADA]'))
    .reduce((sum: number, e: any) => sum + parseFloat(e.totalValue || "0"), 0);

  const lucroLiquido = totalReceitas - totalDespesas;
  const margemLucro = totalReceitas > 0 ? (lucroLiquido / totalReceitas) * 100 : 0;

  const financialData: FinancialData = {
    totalReceitas,
    totalDespesas,
    lucroLiquido,
    margemLucro
  };

  const isLoading = isLoadingBilling || isLoadingExpenses;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-64">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Calculator className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Análise Final</h1>
                <p className="text-sm text-gray-600">
                  Faturamento - Gastos = Lucro Líquido
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Cards de resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-blue-500 p-3 rounded-full">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Total Receitas</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatCurrency(financialData.totalReceitas)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-red-500 p-3 rounded-full">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-red-600">Total Despesas</p>
                        <p className="text-2xl font-bold text-red-900">
                          {formatCurrency(financialData.totalDespesas)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`bg-gradient-to-r ${
                  financialData.lucroLiquido >= 0 
                    ? 'from-green-50 to-green-100 border-green-200' 
                    : 'from-orange-50 to-orange-100 border-orange-200'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-full ${
                        financialData.lucroLiquido >= 0 ? 'bg-green-500' : 'bg-orange-500'
                      }`}>
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm font-medium ${
                          financialData.lucroLiquido >= 0 ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          Lucro Líquido
                        </p>
                        <p className={`text-2xl font-bold ${
                          financialData.lucroLiquido >= 0 ? 'text-green-900' : 'text-orange-900'
                        }`}>
                          {formatCurrency(financialData.lucroLiquido)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`bg-gradient-to-r ${
                  financialData.margemLucro >= 20 
                    ? 'from-emerald-50 to-emerald-100 border-emerald-200'
                    : financialData.margemLucro >= 10
                    ? 'from-yellow-50 to-yellow-100 border-yellow-200'
                    : 'from-red-50 to-red-100 border-red-200'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-full ${
                        financialData.margemLucro >= 20 
                          ? 'bg-emerald-500'
                          : financialData.margemLucro >= 10
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}>
                        <Calculator className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className={`text-sm font-medium ${
                          financialData.margemLucro >= 20 
                            ? 'text-emerald-600'
                            : financialData.margemLucro >= 10
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          Margem de Lucro
                        </p>
                        <p className={`text-2xl font-bold ${
                          financialData.margemLucro >= 20 
                            ? 'text-emerald-900'
                            : financialData.margemLucro >= 10
                            ? 'text-yellow-900'
                            : 'text-red-900'
                        }`}>
                          {financialData.margemLucro.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Análise detalhada */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Breakdown Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-900">Receitas Totais</span>
                        <span className="font-bold text-blue-900">
                          {formatCurrency(financialData.totalReceitas)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="font-medium text-red-900">(-) Despesas Totais</span>
                        <span className="font-bold text-red-900">
                          {formatCurrency(financialData.totalDespesas)}
                        </span>
                      </div>
                      <div className="border-t pt-3">
                        <div className={`flex justify-between items-center p-3 rounded-lg ${
                          financialData.lucroLiquido >= 0 
                            ? 'bg-green-50' 
                            : 'bg-orange-50'
                        }`}>
                          <span className={`font-bold ${
                            financialData.lucroLiquido >= 0 
                              ? 'text-green-900' 
                              : 'text-orange-900'
                          }`}>
                            (=) Lucro Líquido
                          </span>
                          <span className={`font-bold text-xl ${
                            financialData.lucroLiquido >= 0 
                              ? 'text-green-900' 
                              : 'text-orange-900'
                          }`}>
                            {formatCurrency(financialData.lucroLiquido)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {financialData.margemLucro >= 15 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      )}
                      Análise de Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg border-l-4 ${
                        financialData.lucroLiquido >= 0 
                          ? 'bg-green-50 border-green-400' 
                          : 'bg-red-50 border-red-400'
                      }`}>
                        <h4 className={`font-semibold ${
                          financialData.lucroLiquido >= 0 ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {financialData.lucroLiquido >= 0 ? 'Resultado Positivo' : 'Resultado Negativo'}
                        </h4>
                        <p className={`text-sm ${
                          financialData.lucroLiquido >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {financialData.lucroLiquido >= 0 
                            ? 'Sua empresa está gerando lucro. Continue monitorando os custos.'
                            : 'Atenção: despesas superiores às receitas. Revise os gastos.'
                          }
                        </p>
                      </div>

                      <div className={`p-4 rounded-lg border-l-4 ${
                        financialData.margemLucro >= 20 
                          ? 'bg-emerald-50 border-emerald-400'
                          : financialData.margemLucro >= 10
                          ? 'bg-yellow-50 border-yellow-400'
                          : 'bg-red-50 border-red-400'
                      }`}>
                        <h4 className={`font-semibold ${
                          financialData.margemLucro >= 20 
                            ? 'text-emerald-800'
                            : financialData.margemLucro >= 10
                            ? 'text-yellow-800'
                            : 'text-red-800'
                        }`}>
                          Margem de Lucro: {financialData.margemLucro.toFixed(1)}%
                        </h4>
                        <p className={`text-sm ${
                          financialData.margemLucro >= 20 
                            ? 'text-emerald-700'
                            : financialData.margemLucro >= 10
                            ? 'text-yellow-700'
                            : 'text-red-700'
                        }`}>
                          {financialData.margemLucro >= 20 
                            ? 'Excelente! Margem de lucro muito saudável.'
                            : financialData.margemLucro >= 10
                            ? 'Boa margem de lucro. Há espaço para melhorias.'
                            : 'Margem baixa. Revise preços e custos operacionais.'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}