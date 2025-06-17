import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
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
  month: string;
  category: string;
  contractNumber: string;
}

export default function Results() {
  const [filters, setFilters] = useState<Filters>({
    month: "",
    category: "",
    contractNumber: "",
  });

  const { data: categoryStats = [] } = useQuery({
    queryKey: ['/api/stats/categories', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.month) params.set('month', filters.month);
      if (filters.contractNumber) params.set('contractNumber', filters.contractNumber);
      
      const response = await apiRequest('GET', `/api/stats/categories?${params}`);
      return response.json();
    },
  });

  const { data: paymentStats = [] } = useQuery({
    queryKey: ['/api/stats/payment-methods', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.month) params.set('month', filters.month);
      if (filters.contractNumber) params.set('contractNumber', filters.contractNumber);
      
      const response = await apiRequest('GET', `/api/stats/payment-methods?${params}`);
      return response.json();
    },
  });

  const { data: monthlyStats = [] } = useQuery({
    queryKey: ['/api/stats/monthly'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/stats/monthly');
      return response.json();
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
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Resultados</h1>
                <p className="text-sm text-gray-600 mt-1">Análise detalhada das despesas</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Chart Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros do Gráfico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="chartMonthFilter">Mês</Label>
                  <Select value={filters.month} onValueChange={(value) => setFilters({ ...filters, month: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os meses</SelectItem>
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date(2024, i, 1);
                        const monthYear = date.toISOString().slice(0, 7);
                        const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                        return (
                          <SelectItem key={monthYear} value={monthYear}>
                            {monthName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="chartCategoryFilter">Categoria</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="chartContractFilter">Contrato</Label>
                  <Input
                    id="chartContractFilter"
                    placeholder="Número do contrato"
                    value={filters.contractNumber}
                    onChange={(e) => setFilters({ ...filters, contractNumber: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {categoryStats.length > 0 ? (
                    <Doughnut 
                      data={categoryChartData}
                      options={{
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
                      }}
                    />
                  ) : (
                    <div className="text-gray-500">Nenhum dado disponível</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {monthlyStats.length > 0 ? (
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
                              callback: function(value) {
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
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Nenhum dado disponível
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {paymentStats.length > 0 ? (
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
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Nenhum dado disponível
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contract Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo por Contrato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryStats.length > 0 ? (
                    categoryStats.map((stat: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{stat.category}</div>
                          <div className="text-sm text-gray-500">{stat.count} despesas</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(stat.total)}
                          </div>
                          <div className="text-sm text-gray-500">Total gasto</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum dado disponível
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
