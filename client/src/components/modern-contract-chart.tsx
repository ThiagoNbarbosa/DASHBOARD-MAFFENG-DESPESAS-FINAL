import { useEffect, useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Award, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ContractData {
  contractNumber: string;
  totalAmount: number;
  expenseCount: number;
}

interface ModernContractChartProps {
  data: ContractData[];
  title?: string;
  showStats?: boolean;
}

// Gradientes modernos para as barras
const GRADIENT_COLORS = [
  { primary: '#3B82F6', secondary: '#60A5FA' }, // Azul
  { primary: '#10B981', secondary: '#34D399' }, // Verde
  { primary: '#F59E0B', secondary: '#FBBF24' }, // Laranja
  { primary: '#EF4444', secondary: '#F87171' }, // Vermelho
  { primary: '#8B5CF6', secondary: '#A78BFA' }, // Roxo
  { primary: '#06B6D4', secondary: '#22D3EE' }, // Ciano
  { primary: '#F97316', secondary: '#FB923C' }, // Laranja escuro
  { primary: '#84CC16', secondary: '#A3E635' }, // Verde lima
];

export default function ModernContractChart({ 
  data, 
  title = "Despesas por Contrato",
  showStats = true 
}: ModernContractChartProps) {
  const chartRef = useRef<any>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calcular estatísticas
  const totalAmount = data.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenseCount, 0);
  const averagePerContract = totalAmount / data.length;
  const highestContract = data.reduce((max, item) => 
    item.totalAmount > max.totalAmount ? item : max, data[0]
  );

  // Preparar dados do gráfico com gradientes
  const chartData = {
    labels: data.map(item => {
      // Truncar nomes longos de contratos
      const name = item.contractNumber.length > 15 
        ? item.contractNumber.substring(0, 12) + '...' 
        : item.contractNumber;
      return name;
    }),
    datasets: [
      {
        label: 'Valor Total (R$)',
        data: data.map(item => item.totalAmount),
        backgroundColor: data.map((_, index) => {
          const color = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
          return `linear-gradient(135deg, ${color.primary}, ${color.secondary})`;
        }),
        borderColor: data.map((_, index) => {
          const color = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
          return color.primary;
        }),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: data.map((_, index) => {
          const color = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
          return color.primary;
        }),
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        padding: 16,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: function(context: any) {
            const fullName = data[context[0].dataIndex].contractNumber;
            return `Contrato: ${fullName}`;
          },
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const contractData = data[dataIndex];
            const value = context.parsed.y;
            const percentage = ((value / totalAmount) * 100).toFixed(1);
            const formatted = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(value);
            const avgPerExpense = contractData.expenseCount > 0 
              ? value / contractData.expenseCount 
              : 0;
            
            return [
              `Valor Total: ${formatted}`,
              `Participação: ${percentage}%`,
              `Despesas: ${contractData.expenseCount}`,
              `Média/Despesa: ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(avgPerExpense)}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
            weight: 500,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        border: {
          display: false,
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          lineWidth: 1,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact',
              maximumFractionDigits: 1,
            }).format(value);
          },
        },
        border: {
          display: false,
        }
      },
    },
    onHover: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        setHoveredIndex(elements[0].index);
        // Cursor pointer para indicar interatividade
        event.native.target.style.cursor = 'pointer';
      } else {
        setHoveredIndex(null);
        event.native.target.style.cursor = 'default';
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart' as const,
      delay: (context: any) => context.dataIndex * 100, // Animação sequencial
    },
  };

  // Cleanup do Chart.js
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          {title}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Análise comparativa de gastos por contrato com detalhes interativos
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Gráfico Principal */}
        <div className="h-96 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <Bar 
            ref={chartRef}
            data={chartData} 
            options={chartOptions}
          />
        </div>

        {/* Lista de Contratos com Detalhes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((contract, index) => {
            const percentage = ((contract.totalAmount / totalAmount) * 100).toFixed(1);
            const color = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
            const isHighest = contract.contractNumber === highestContract.contractNumber;
            
            return (
              <div
                key={contract.contractNumber}
                className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                  hoveredIndex === index 
                    ? 'bg-gray-100 border-gray-300 shadow-md transform scale-105' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm mt-1"
                    style={{ backgroundColor: color.primary }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {contract.contractNumber}
                      </p>
                      {isHighest && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                          <Award className="h-3 w-3 mr-1" />
                          Top
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          maximumFractionDigits: 0
                        }).format(contract.totalAmount)}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {percentage}%
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {contract.expenseCount} despesas
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        Média: {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(contract.expenseCount > 0 ? contract.totalAmount / contract.expenseCount : 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estatísticas Resumidas */}
        {showStats && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-100">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estatísticas Gerais
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-gray-600">Total Geral</p>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(totalAmount)}
                </p>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-gray-600">Média/Contrato</p>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(averagePerContract)}
                </p>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Award className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-medium text-gray-600">Maior Contrato</p>
                </div>
                <p className="text-xl font-bold text-orange-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(highestContract?.totalAmount || 0)}
                </p>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
                </div>
                <p className="text-xl font-bold text-purple-600">{data.length}</p>
              </div>
            </div>
            
            {/* Contrato em destaque */}
            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-orange-200">
              <p className="text-sm font-medium text-orange-800 mb-1">🏆 Contrato com Maior Volume</p>
              <p className="text-lg font-bold text-orange-900">{highestContract?.contractNumber}</p>
              <p className="text-sm text-orange-700">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(highestContract?.totalAmount || 0)} • {highestContract?.expenseCount} despesas
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}