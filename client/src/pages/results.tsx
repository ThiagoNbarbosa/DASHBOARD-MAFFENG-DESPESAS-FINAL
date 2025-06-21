import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import ExpensesByContract from "@/components/expenses-by-contract";
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div style={{ height: '300px' }}>
                  <Doughnut data={categoryChartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          padding: 20,
                          usePointStyle: true
                        }
                      }
                    }
                  }} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Distribuição por Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <div style={{ height: '300px', minWidth: '300px' }}>
                    <Bar
                      data={paymentChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Evolução Mensal</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <div style={{ height: '400px', minWidth: '600px' }}>
                    <Line
                      data={monthlyChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function (value) {
                                return new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(value as number);
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seção de Despesas por Contrato */}
          <div className="mt-8">
            <ExpensesByContract filters={filters} />
          </div>
        </main>
      </div>
    </div>
  );
}