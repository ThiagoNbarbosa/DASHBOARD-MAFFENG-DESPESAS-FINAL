import { useEffect, useRef, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, TrendingUp, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

interface ModernCategoryChartProps {
  data: CategoryData[];
  title?: string;
  showLegend?: boolean;
  showStats?: boolean;
}

// Paleta de cores moderna e vibrante
const MODERN_COLORS = [
  '#3B82F6', // Azul principal
  '#10B981', // Verde
  '#F59E0B', // Laranja
  '#EF4444', // Vermelho
  '#8B5CF6', // Roxo
  '#06B6D4', // Ciano
  '#F97316', // Laranja escuro
  '#84CC16', // Verde lima
  '#EC4899', // Rosa
  '#6B7280', // Cinza
  '#14B8A6', // Teal
  '#F59E0B', // Âmbar
  '#8B5CF6', // Índigo
  '#EF4444', // Rose
  '#22C55E', // Esmeralda
];

const HOVER_COLORS = MODERN_COLORS.map(color => color + '90'); // Adiciona transparência para hover

export default function ModernCategoryChart({ 
  data, 
  title = "Despesas por Categoria",
  showLegend = true,
  showStats = true 
}: ModernCategoryChartProps) {
  const chartRef = useRef<any>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calcular total geral
  const totalAmount = data.reduce((sum, item) => sum + item.total, 0);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  const averagePerCategory = totalAmount / data.length;

  // Preparar dados do gráfico
  const chartData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        data: data.map(item => item.total),
        backgroundColor: MODERN_COLORS.slice(0, data.length),
        hoverBackgroundColor: HOVER_COLORS.slice(0, data.length),
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderWidth: 4,
        hoverBorderColor: '#ffffff',
        cutout: '65%', // Cria um gráfico de rosquinha mais moderno
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: true,
      mode: 'point' as const,
    },
    plugins: {
      legend: {
        display: false, // Vamos criar nossa própria legenda personalizada
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: false,
        padding: 16,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        position: function(elements: any, eventPosition: any) {
          // Posiciona o tooltip fora do gráfico baseado na posição do mouse
          const centerX = 200; // Centro aproximado do gráfico
          const centerY = 200; // Centro aproximado do gráfico
          
          // Calcula a direção do tooltip baseada na posição do mouse
          const deltaX = eventPosition.x - centerX;
          const deltaY = eventPosition.y - centerY;
          
          // Posiciona o tooltip na direção oposta ao centro
          return {
            x: eventPosition.x + (deltaX > 0 ? 80 : -80),
            y: eventPosition.y + (deltaY > 0 ? 40 : -40)
          };
        },
        intersect: true,
        mode: 'point' as const,
        caretPadding: 15,
        callbacks: {
          title: function(context: any) {
            return context[0]?.label || '';
          },
          label: function(context: any) {
            const value = context.parsed;
            const percentage = ((value / totalAmount) * 100).toFixed(1);
            const formatted = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(value);
            return [
              `Valor: ${formatted}`,
              `Participação: ${percentage}%`,
              `Transações: ${data[context.dataIndex]?.count || 0}`
            ];
          }
        }
      }
    },
    onHover: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        setHoveredIndex(elements[0].index);
      } else {
        setHoveredIndex(null);
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeOutQuart' as const,
    },
    elements: {
      arc: {
        borderRadius: 8,
      }
    }
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

  // Calcular dados para a legenda personalizada
  const legendData = data.map((item, index) => ({
    ...item,
    color: MODERN_COLORS[index],
    percentage: ((item.total / totalAmount) * 100).toFixed(1),
    isHovered: hoveredIndex === index
  }));

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <PieChart className="h-6 w-6 text-white" />
          </div>
          {title}
        </CardTitle>
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Análise detalhada de gastos por categoria
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Gráfico Principal */}
        <div className="relative">
          <div className="h-80 relative">
            <Doughnut 
              ref={chartRef}
              data={chartData} 
              options={chartOptions}
            />
            
            {/* Centro do gráfico com informação total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg">
                <p className="text-sm font-medium text-gray-600">Total Geral</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(totalAmount)}
                </p>
                <p className="text-xs text-gray-500">{totalCount} transações</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legenda Personalizada em Grid */}
        {showLegend && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {legendData.map((item, index) => (
              <div
                key={item.category}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  item.isHovered 
                    ? 'bg-gray-100 border-gray-300 shadow-md transform scale-105' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.category}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        maximumFractionDigits: 0
                      }).format(item.total)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {item.percentage}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estatísticas Resumidas */}
        {showStats && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Estatísticas Resumidas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(totalAmount)}
                </p>
                <p className="text-sm text-gray-600">Total Geral</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(averagePerCategory)}
                </p>
                <p className="text-sm text-gray-600">Média por Categoria</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{data.length}</p>
                <p className="text-sm text-gray-600">Categorias Ativas</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}