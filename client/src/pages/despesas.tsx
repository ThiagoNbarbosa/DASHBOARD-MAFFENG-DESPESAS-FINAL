import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import ExpenseTable from "@/components/expense-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Calendar, Receipt } from "lucide-react";

export default function Despesas() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-64">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Despesas</h1>
                <p className="text-sm text-gray-600">
                  Controle total dos seus gastos empresariais
                </p>
              </div>
            </div>
            
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

        {/* Informações do usuário */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Receipt className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Bem-vindo(a), {user.name}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">
                    Perfil: {user.role} • Acesso completo ao sistema de despesas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo principal */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          <ExpenseTable />
        </div>
      </div>
    </div>
  );
}