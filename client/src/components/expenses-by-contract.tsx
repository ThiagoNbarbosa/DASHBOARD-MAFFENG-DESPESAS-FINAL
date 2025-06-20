import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Progress component inline implementation
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
    <div 
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);
import { FileText, TrendingUp, DollarSign } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ContractExpense {
  contractNumber: string;
  totalAmount: number;
  expenseCount: number;
  categories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

interface ExpensesByContractProps {
  filters?: {
    month?: string;
    contractNumber?: string;
  };
}

export default function ExpensesByContract({ filters }: ExpensesByContractProps) {
  // Query para buscar despesas agrupadas por contrato com dados reais
  const { data: contractExpenses = [], isLoading } = useQuery({
    queryKey: ['/api/expenses/by-contract', filters],
    queryFn: async (): Promise<ContractExpense[]> => {
      try {
        // Buscar todas as despesas
        const response = await fetch('/api/expenses');
        if (!response.ok) {
          throw new Error('Erro ao buscar despesas');
        }
        
        const expenses = await response.json();
        
        // Agrupar despesas por contrato
        const contractMap = new Map<string, {
          totalAmount: number;
          expenseCount: number;
          categories: Map<string, { amount: number; count: number }>;
        }>();

        expenses.forEach((expense: any) => {
          // Ignorar despesas canceladas na análise por contrato
          if (expense.category?.startsWith('[CANCELADA]')) {
            return;
          }

          const contractNumber = expense.contractNumber;
          const value = parseFloat(expense.value);

          if (!contractMap.has(contractNumber)) {
            contractMap.set(contractNumber, {
              totalAmount: 0,
              expenseCount: 0,
              categories: new Map(),
            });
          }

          const contract = contractMap.get(contractNumber)!;
          contract.totalAmount += value;
          contract.expenseCount += 1;

          // Agrupar por categoria
          const category = expense.category;
          if (!contract.categories.has(category)) {
            contract.categories.set(category, { amount: 0, count: 0 });
          }

          const categoryData = contract.categories.get(category)!;
          categoryData.amount += value;
          categoryData.count += 1;
        });

        // Converter para formato final
        const result = Array.from(contractMap.entries()).map(([contractNumber, data]) => ({
          contractNumber,
          totalAmount: data.totalAmount,
          expenseCount: data.expenseCount,
          categories: Array.from(data.categories.entries()).map(([category, categoryData]) => ({
            category,
            amount: categoryData.amount,
            count: categoryData.count,
          })),
        }));

        // Ordenar por valor total (decrescente)
        result.sort((a, b) => b.totalAmount - a.totalAmount);

        return result;
      } catch (error) {
        console.error('Erro ao carregar despesas por contrato:', error);
        return [];
      }
    },
  });

  // Dados para o gráfico de barras
  const chartData = {
    labels: contractExpenses.map(c => `Contrato ${c.contractNumber}`),
    datasets: [
      {
        label: 'Total de Despesas (R$)',
        data: contractExpenses.map(c => c.totalAmount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Despesas por Contrato',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `Total: ${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          }
        }
      },
    },
  };

  // Calcular totais
  const totalGeral = contractExpenses.reduce((sum, contract) => sum + contract.totalAmount, 0);
  const totalExpenses = contractExpenses.reduce((sum, contract) => sum + contract.expenseCount, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Despesas por Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            Carregando dados dos contratos...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contractExpenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Despesas por Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Nenhuma despesa encontrada para os filtros selecionados
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Geral</p>
                <p className="text-2xl font-bold text-blue-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(totalGeral)}
                </p>
              </div>
              <div className="h-10 w-10 bg-blue-200 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total de Contratos</p>
                <p className="text-2xl font-bold text-green-900">
                  {contractExpenses.length}
                </p>
              </div>
              <div className="h-10 w-10 bg-green-200 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total de Despesas</p>
                <p className="text-2xl font-bold text-purple-900">
                  {totalExpenses}
                </p>
              </div>
              <div className="h-10 w-10 bg-purple-200 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Gráfico de Despesas por Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Lista Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhamento por Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contractExpenses.map((contract, index) => {
              const percentage = totalGeral > 0 ? (contract.totalAmount / totalGeral) * 100 : 0;
              
              return (
                <div key={contract.contractNumber} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm">
                        Contrato {contract.contractNumber}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {contract.expenseCount} despesa{contract.expenseCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(contract.totalAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {percentage.toFixed(1)}% do total
                      </p>
                    </div>
                  </div>
                  
                  <Progress value={percentage} className="mb-3" />
                  
                  {/* Categorias do contrato */}
                  {contract.categories.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Categorias:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {contract.categories.map((cat, catIndex) => (
                          <div key={catIndex} className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {cat.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(cat.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}