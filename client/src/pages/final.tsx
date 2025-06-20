import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TrendingUp, DollarSign, Calculator, Filter } from "lucide-react";

export default function Final() {
  const [filters, setFilters] = useState({
    month: "",
    year: new Date().getFullYear().toString(),
    contractNumber: "",
  });

  // Query para buscar dados de faturamento
  const { data: billingData = [], isLoading: billingLoading } = useQuery({
    queryKey: ['/api/billing', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.month && filters.month !== 'all') params.append('month', filters.month);
      if (filters.contractNumber) params.append('contractNumber', filters.contractNumber);

      const response = await fetch(`/api/billing?${params}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar faturamento');
      }
      
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        value: parseFloat(item.value),
        status: item.status,
        contractNumber: item.contractNumber,
        issueDate: item.issueDate
      }));
    },
  });

  // Query para buscar dados de despesas
  const { data: expensesData = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['/api/expenses', filters],
    queryFn: async () => {
      const response = await fetch('/api/expenses');
      if (!response.ok) {
        throw new Error('Erro ao buscar despesas');
      }
      return response.json();
    },
  });

  // Filtrar dados por mês/ano/contrato
  const filteredBilling = billingData.filter((billing: any) => {
    const billingDate = new Date(billing.issueDate);
    const billingMonth = (billingDate.getMonth() + 1).toString().padStart(2, '0');
    const billingYear = billingDate.getFullYear().toString();

    return (
      (!filters.month || filters.month === "all" || billingMonth === filters.month) &&
      (!filters.year || billingYear === filters.year) &&
      (!filters.contractNumber || billing.contractNumber.includes(filters.contractNumber)) &&
      billing.status === "pago" // Apenas valores pagos contam como faturamento
    );
  });

  const filteredExpenses = expensesData.filter((expense: any) => {
    // Ignorar despesas canceladas
    if (expense.category?.startsWith('[CANCELADA]')) {
      return false;
    }

    const expenseDate = new Date(expense.paymentDate);
    const expenseMonth = (expenseDate.getMonth() + 1).toString().padStart(2, '0');
    const expenseYear = expenseDate.getFullYear().toString();

    return (
      (!filters.month || filters.month === "all" || expenseMonth === filters.month) &&
      (!filters.year || expenseYear === filters.year) &&
      (!filters.contractNumber || expense.contractNumber.includes(filters.contractNumber))
    );
  });

  // Cálculos
  const totalFaturamento = filteredBilling.reduce((sum: number, billing: any) => sum + billing.value, 0);
  const totalGastos = filteredExpenses.reduce((sum: number, expense: any) => sum + parseFloat(expense.value || expense.totalValue || "0"), 0);
  const lucro = totalFaturamento - totalGastos;
  const margemLucro = totalFaturamento > 0 ? (lucro / totalFaturamento) * 100 : 0;

  const isLoading = billingLoading || expensesLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Calculator className="h-8 w-8 text-primary" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Resultado Final</h1>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Análise de lucro: Faturamento - Gastos = Lucro
              </p>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Ano
                  </label>
                  <Select
                    value={filters.year}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Mês
                  </label>
                  <Select
                    value={filters.month}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os meses</SelectItem>
                      <SelectItem value="01">Janeiro</SelectItem>
                      <SelectItem value="02">Fevereiro</SelectItem>
                      <SelectItem value="03">Março</SelectItem>
                      <SelectItem value="04">Abril</SelectItem>
                      <SelectItem value="05">Maio</SelectItem>
                      <SelectItem value="06">Junho</SelectItem>
                      <SelectItem value="07">Julho</SelectItem>
                      <SelectItem value="08">Agosto</SelectItem>
                      <SelectItem value="09">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Contrato
                  </label>
                  <Input
                    placeholder="Número do contrato"
                    value={filters.contractNumber}
                    onChange={(e) => setFilters(prev => ({ ...prev, contractNumber: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="text-center py-8">Carregando dados...</div>
          ) : (
            <>
              {/* Cards de Resultado */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Faturamento Total</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(totalFaturamento)}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Gastos</p>
                        <p className="text-2xl font-bold text-red-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(totalGastos)}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
                        <p className={`text-2xl font-bold ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(lucro)}
                        </p>
                      </div>
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        lucro >= 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Calculator className={`h-6 w-6 ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Margem de Lucro</p>
                        <p className={`text-2xl font-bold ${margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {margemLucro.toFixed(1)}%
                        </p>
                      </div>
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        margemLucro >= 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <TrendingUp className={`h-6 w-6 ${margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resumo Detalhado */}
              <Card>
                <CardHeader>
                  <CardTitle>Análise Detalhada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-800">Faturamento Total (Valores Pagos)</span>
                      <span className="font-bold text-blue-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(totalFaturamento)}
                      </span>
                    </div>
                    
                    <div className="flex justify-center">
                      <span className="text-2xl font-bold text-gray-500">-</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                      <span className="font-medium text-red-800">Total de Gastos</span>
                      <span className="font-bold text-red-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(totalGastos)}
                      </span>
                    </div>
                    
                    <div className="flex justify-center">
                      <span className="text-2xl font-bold text-gray-500">=</span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-4 rounded-lg ${
                      lucro >= 0 ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <span className={`font-medium ${lucro >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        Lucro Líquido
                      </span>
                      <span className={`font-bold text-xl ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(lucro)}
                      </span>
                    </div>

                    {lucro < 0 && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 font-medium">
                          ⚠️ Atenção: O resultado está negativo. Os gastos estão superando o faturamento.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}