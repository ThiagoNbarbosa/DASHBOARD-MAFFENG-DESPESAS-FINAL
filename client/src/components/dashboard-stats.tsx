import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, FileText, Calendar, Building } from "lucide-react";

interface Stats {
  totalAmount: number;
  totalExpenses: number;
  thisMonth: number;
  activeContracts: number;
}

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-12 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Gasto",
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(stats?.totalAmount || 0),
      icon: DollarSign,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Despesas",
      value: stats?.totalExpenses || 0,
      icon: FileText,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Este Mês",
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(stats?.thisMonth || 0),
      icon: Calendar,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      title: "Contratos Ativos",
      value: stats?.activeContracts || 0,
      icon: Building,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card key={index} className="shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}