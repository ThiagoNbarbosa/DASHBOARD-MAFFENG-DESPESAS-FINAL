import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import DashboardStats from "@/components/dashboard-stats";
import ExpenseTable from "@/components/expense-table";
import { authApi } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Calendar, User, Building2 } from "lucide-react";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="lg:pl-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
                  <p className="text-sm text-gray-600">
                    Visão completa das suas finanças empresariais
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Informações do usuário */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Bem-vindo(a), {user?.name}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">
                      Perfil: {user?.role} • Sistema financeiro MAFFENG
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-2 text-xs text-gray-500">
                  <Building2 className="h-4 w-4" />
                  <span>Sistema integrado de gestão</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <main className="px-4 sm:px-6 lg:px-8 pb-8">
          <DashboardStats />
          <ExpenseTable />
        </main>
      </div>
    </div>
  );
}