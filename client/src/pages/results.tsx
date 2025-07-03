import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import ExpensesByContract from "@/components/expenses-by-contract";
import ModernCategoryChart from "@/components/modern-category-chart";
import ModernContractChart from "@/components/modern-contract-chart";
import ModernPaymentChart from "@/components/modern-payment-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Filters {
  year: string;
  month: string;
  category: string;
  contractNumber: string;
}

export default function Results() {
  const [filters, setFilters] = useState<Filters>({
    year: "2025",
    month: "all",
    category: "all",
    contractNumber: "",
  });

  const { data: categoryStats = [] } = useQuery({
    queryKey: ['/api/stats/categories', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.month && filters.month !== "all") {
        const monthFilter = filters.year + "-" + filters.month;
        params.set('month', monthFilter);
      }
      if (filters.contractNumber) params.set('contractNumber', filters.contractNumber);

      return await apiRequest(`/api/stats/categories?${params}`, 'GET');
    },
  });

  const { data: paymentStats = [] } = useQuery({
    queryKey: ['/api/stats/payment-methods', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.month && filters.month !== "all") {
        const monthFilter = filters.year + "-" + filters.month;
        params.set('month', monthFilter);
      }
      if (filters.contractNumber) params.set('contractNumber', filters.contractNumber);

      return await apiRequest(`/api/stats/payment-methods?${params}`, 'GET');
    },
  });

  const { data: monthlyStats = [] } = useQuery({
    queryKey: ['/api/stats/monthly'],
    queryFn: async () => {
      return await apiRequest('/api/stats/monthly', 'GET');
    },
  });

  // Buscar dados de despesas para análise por contrato
  const { data: expenses = [] } = useQuery({
    queryKey: ['/api/expenses', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.year && filters.year !== "all") params.set('year', filters.year);
      if (filters.month && filters.month !== "all") params.set('month', filters.month);
      if (filters.category && filters.category !== "all") params.set('category', filters.category);
      if (filters.contractNumber) params.set('contractNumber', filters.contractNumber);
      
      return await apiRequest(`/api/expenses?${params}`, 'GET');
    },
  });

  // Preparar dados para o gráfico de contratos
  const contractData = useMemo(() => {
    if (!expenses.length) return [];
    
    const contractMap = new Map();
    
    expenses.forEach((expense: any) => {
      const contract = expense.contractNumber || 'Sem Contrato';
      
      if (!contractMap.has(contract)) {
        contractMap.set(contract, {
          contractNumber: contract,
          totalAmount: 0,
          expenseCount: 0,
        });
      }
      
      const contractInfo = contractMap.get(contract);
      contractInfo.totalAmount += parseFloat(expense.value || 0);
      contractInfo.expenseCount += 1;
    });
    
    return Array.from(contractMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [expenses]);

  const categoryChartData = {
    labels: categoryStats.map((stat: any) => stat.category),
    datasets: [{
      data: categoryStats.map((stat: any) => stat.total),
      backgroundColor: [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#06B6D4'
      ],
      borderWidth: 2,
      borderColor: '#FFFFFF'
    }]
  };

  const monthlyChartData = {
    labels: monthlyStats.map((stat: any) => {
      const date = new Date(stat.month + '-01');
      return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    }),
    datasets: [{
      label: 'Despesas (R$)',
      data: monthlyStats.map((stat: any) => stat.total),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4
    }]
  };

  const paymentChartData = {
    labels: paymentStats.map((stat: any) => stat.paymentMethod),
    datasets: [{
      label: 'Quantidade',
      data: paymentStats.map((stat: any) => stat.count),
      backgroundColor: [
        '#10B981',
        '#3B82F6',
        '#F59E0B',
        '#EF4444'
      ],
      borderRadius: 8,
      borderSkipped: false as any
    }]
  };

  const categories = [
    "Pagamento funcionários",
    "Material",
    "Mão de Obra",
    "Prestador de serviços",
    "Aluguel de ferramentas",
    "Manutenção em veículo",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="lg:pl-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Resultados</h1>
              <p className="text-xs sm:text-sm text-gray-600">Análise detalhada das despesas</p>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {/* Gráfico de Evolução Mensal - Destaque Principal */}
          <Card className="shadow-sm mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                📈 Evolução Mensal
              </CardTitle>
              <p className="text-sm text-gray-600">Tendência de gastos ao longo dos meses</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <div style={{ height: '450px', minWidth: '800px' }}>
                  <Line
                    data={monthlyChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top' as const,
                          labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                              size: 14
                            }
                          }
                        },
                        tooltip: {
                          mode: 'index',
                          intersect: false,
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'white',
                          bodyColor: 'white',
                          borderColor: '#3B82F6',
                          borderWidth: 1,
                          callbacks: {
                            label: function(context) {
                              return `Despesas: ${new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(context.parsed.y)}`;
                            }
                          }
                        }
                      },
                      interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                      },
                      scales: {
                        x: {
                          display: true,
                          title: {
                            display: true,
                            text: 'Período',
                            font: {
                              size: 14,
                              weight: 'bold'
                            }
                          },
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                          }
                        },
                        y: {
                          display: true,
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Valor (R$)',
                            font: {
                              size: 14,
                              weight: 'bold'
                            }
                          },
                          grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                          },
                          ticks: {
                            callback: function (value) {
                              return new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                notation: 'compact',
                                maximumFractionDigits: 1
                              }).format(value as number);
                            },
                            font: {
                              size: 12
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Estatísticas Resumidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-600">Total Acumulado</p>
                  <p className="text-xl font-bold text-blue-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(monthlyStats.reduce((acc: number, stat: any) => acc + stat.total, 0))}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-600">Média Mensal</p>
                  <p className="text-xl font-bold text-green-900">
                    {monthlyStats.length > 0 ? new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(monthlyStats.reduce((acc: number, stat: any) => acc + stat.total, 0) / monthlyStats.length) : 'R$ 0,00'}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-600">Períodos</p>
                  <p className="text-xl font-bold text-orange-900">
                    {monthlyStats.length} meses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Categoria Moderno */}
          <div className="mb-8">
            <ModernCategoryChart 
              data={categoryStats}
              title="Despesas por Categoria"
              showLegend={true}
              showStats={true}
            />
          </div>

          {/* Gráfico de Formas de Pagamento Moderno */}
          <div className="mb-8">
            <ModernPaymentChart 
              data={paymentStats}
              title="Distribuição por Forma de Pagamento"
              showStats={true}
            />
          </div>

          {/* Gráfico de Contratos Moderno */}
          <div className="mt-8">
            <ModernContractChart 
              data={contractData}
              title="Análise Detalhada por Contrato"
              showStats={true}
            />
          </div>
        </main>
      </div>
    </div>
  );
}