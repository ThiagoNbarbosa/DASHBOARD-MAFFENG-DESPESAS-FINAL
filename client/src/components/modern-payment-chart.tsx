import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface ModernPaymentChartProps {
  data: Array<{ paymentMethod: string; count: number }>;
  title?: string;
  showStats?: boolean;
}

export default function ModernPaymentChart({ 
  data, 
  title = "Formas de Pagamento", 
  showStats = true 
}: ModernPaymentChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  const totalTransactions = data.reduce((sum, item) => sum + item.count, 0);
  const mostUsedMethod = data.reduce((max, item) => 
    item.count > max.count ? item : max, data[0]
  );

  const colorPalette = [
    'rgba(99, 102, 241, 0.8)',   // Indigo
    'rgba(16, 185, 129, 0.8)',   // Emerald
    'rgba(245, 158, 11, 0.8)',   // Amber
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(139, 92, 246, 0.8)',   // Violet
    'rgba(6, 182, 212, 0.8)',    // Cyan
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(34, 197, 94, 0.8)',    // Green
  ];

  const chartData = {
    labels: data.map(item => item.paymentMethod),
    datasets: [
      {
        label: 'Transações',
        data: data.map(item => item.count),
        backgroundColor: data.map((_, index) => colorPalette[index % colorPalette.length]),
        borderColor: data.map((_, index) => 
          colorPalette[index % colorPalette.length].replace('0.8', '1')
        ),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            const percentage = ((context.parsed.y / totalTransactions) * 100).toFixed(1);
            return `${context.parsed.y} transações (${percentage}%)`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
          maxRotation: 45,
        },
      },
    },
    interaction: {
      intersect: false,
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Transações</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalTransactions}</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Mais Usado</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
                {mostUsedMethod.paymentMethod}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Métodos Ativos</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{data.length}</p>
            </div>
          </div>
        )}

        {/* Gráfico */}
        <div className="relative">
          <div className="h-80 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Lista de métodos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((item, index) => (
            <div
              key={item.paymentMethod}
              className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colorPalette[index % colorPalette.length] }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {item.paymentMethod}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {item.count}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {((item.count / totalTransactions) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}