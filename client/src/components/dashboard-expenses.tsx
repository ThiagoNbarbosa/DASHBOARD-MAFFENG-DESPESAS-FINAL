import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { authApi } from "@/lib/auth";
import { formatDateSafely } from "@/lib/date-utils";

import type { Expense } from "@shared/schema";

export default function DashboardExpenses() {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  // Query para buscar dados do usuário da despesa selecionada
  const { data: expenseUser } = useQuery({
    queryKey: ['/api/users', selectedExpense?.userId],
    queryFn: async () => {
      if (!selectedExpense?.userId) return null;
      try {
        return await apiRequest(`/api/users/${selectedExpense.userId}`, 'GET');
      } catch (error) {
        return { name: 'Usuário não encontrado' };
      }
    },
    enabled: !!selectedExpense?.userId,
  });

  // Query para despesas recentes
  const { data: recentExpenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
    queryFn: async () => {
      return await apiRequest('/api/expenses', 'GET');
    },
  });

  // Função para abrir modal de detalhes
  const handleViewDetails = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDetailsModalOpen(true);
  };

  const isCancelled = (category: string) => {
    return category.startsWith('[CANCELADA]');
  };

  const getCategoryColor = (category: string) => {
    // Check if the expense is cancelled
    if (category.startsWith('[CANCELADA]')) {
      return "bg-red-50 text-red-600 border border-red-200";
    }

    const colors: Record<string, string> = {
      "Material": "bg-blue-100 text-blue-800",
      "Pagamento funcionários": "bg-green-100 text-green-800",
      "Mão de Obra": "bg-yellow-100 text-yellow-800",
      "Prestador de serviços": "bg-red-100 text-red-800",
      "Aluguel de ferramentas": "bg-purple-100 text-purple-800",
      "Manutenção em veículo": "bg-orange-100 text-orange-800",
    };

    // Remove the [CANCELADA] prefix for color matching
    const cleanCategory = category.replace('[CANCELADA] ', '');
    return colors[cleanCategory] || "bg-gray-100 text-gray-800";
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "Pix":
        return "🟢";
      case "Cartão de Crédito":
        return "💳";
      case "Boleto à Vista":
        return "🟠";
      case "Boleto a Prazo":
        return "🔴";
      default:
        return "💰";
    }
  };

  return (
    <div className="space-y-6">
      {/* Recent Expenses Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Despesas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando despesas...</div>
          ) : recentExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma despesa encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Banco Emissor</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExpenses.slice(0, 10).map((expense: Expense) => (
                    <TableRow 
                      key={expense.id}
                      className={isCancelled(expense.category) ? "bg-red-50" : ""}
                    >
                      <TableCell>
                        <div className={`font-medium ${isCancelled(expense.category) ? "text-red-600" : ""}`}>
                          {expense.item}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(expense.category)}>
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className={isCancelled(expense.category) ? "text-red-600" : ""}>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(parseFloat(expense.value))}
                      </TableCell>
                      <TableCell className={isCancelled(expense.category) ? "text-red-600" : ""}>
                        <div className="flex items-center gap-2">
                          <span>{getPaymentMethodIcon(expense.paymentMethod)}</span>
                          <span>{expense.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell className={isCancelled(expense.category) ? "text-red-600" : ""}>
                        <span className="text-sm">
                          {expense.bankIssuer || '-'}
                        </span>
                      </TableCell>
                      <TableCell className={isCancelled(expense.category) ? "text-red-600" : ""}>
                        {expense.contractNumber}
                      </TableCell>
                      <TableCell className={isCancelled(expense.category) ? "text-red-600" : ""}>
                        {formatDateSafely(expense.paymentDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            onClick={() => handleViewDetails(expense)}
                            title="Visualizar detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes da Despesa */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Despesa</DialogTitle>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-4">
              {/* Nome do usuário responsável */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável
                </label>
                <p className="text-gray-900">
                  {expenseUser?.name || `Usuário ID: ${selectedExpense.userId}`}
                </p>
              </div>

              {/* Descrição da despesa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <p className="text-gray-900">{selectedExpense.item}</p>
              </div>

              {/* Miniatura da imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comprovante
                </label>
                <div className="flex justify-center">
                  {selectedExpense.imageUrl ? (
                    <img
                      src={selectedExpense.imageUrl}
                      alt="Comprovante da despesa"
                      className="w-[150px] h-[150px] object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className="hidden w-[150px] h-[150px] bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                    <p className="text-red-600 text-sm text-center px-2">
                      Erro ao carregar imagem
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor
                  </label>
                  <p className="text-gray-900 font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(parseFloat(selectedExpense.value))}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contrato
                  </label>
                  <p className="text-gray-900">{selectedExpense.contractNumber}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}