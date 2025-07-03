import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Ban, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDateSafely } from "@/lib/date-utils";
import { apiRequest } from "@/lib/queryClient";
import type { Expense, User } from "@shared/schema";

interface AllExpensesTableProps {
  user: User | null;
}

export function AllExpensesTable({ user }: AllExpensesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseUser, setExpenseUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const itemsPerPage = 100;

  // Query para buscar todas as despesas com paginação
  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['/api/expenses/paginated', currentPage, itemsPerPage],
    queryFn: async () => {
      const response = await fetch(`/api/expenses/paginated?page=${currentPage}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar despesas');
      }
      return response.json();
    },
  });

  const expenses = paginatedData?.expenses || [];
  const totalPages = paginatedData?.totalPages || 1;
  const totalItems = paginatedData?.totalItems || 0;

  // Mutations para cancelar e deletar despesas
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/expenses/${id}/cancel`, 'PUT');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/paginated'] });
      toast({
        title: "Despesa cancelada",
        description: "A despesa foi cancelada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar despesa",
        description: error.message || "Ocorreu um erro ao cancelar a despesa.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/expenses/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/paginated'] });
      toast({
        title: "Despesa excluída",
        description: "A despesa foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir despesa",
        description: error.message || "Ocorreu um erro ao excluir a despesa.",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = async (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDetailsModalOpen(true);
    
    // Buscar dados do usuário
    try {
      const response = await fetch(`/api/users/${expense.userId}`);
      if (response.ok) {
        const userData = await response.json();
        setExpenseUser(userData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
  };

  const handleCancel = (id: string) => {
    if (window.confirm("Tem certeza que deseja cancelar esta despesa?")) {
      cancelMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate(id);
    }
  };

  const isCancelled = (category: string) => {
    return category.startsWith('[CANCELADA]');
  };

  const getCategoryColor = (category: string) => {
    if (isCancelled(category)) {
      return "bg-red-100 text-red-800";
    }
    return "bg-blue-100 text-blue-800";
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'PIX':
        return '🏦';
      case 'Cartão de Crédito':
        return '💳';
      case 'Boleto':
        return '📄';
      case 'Transferência Bancária':
        return '🔄';
      case 'Débito automático':
        return '🔁';
      default:
        return '💰';
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Todas as Despesas
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({totalItems} {totalItems === 1 ? 'despesa' : 'despesas'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando despesas...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma despesa encontrada
            </div>
          ) : (
            <>
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
                    {expenses.map((expense: Expense) => (
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
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {user?.role === "admin" && (
                              <>
                                {!isCancelled(expense.category) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                    onClick={() => handleCancel(expense.id)}
                                    disabled={cancelMutation.isPending}
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => handleDelete(expense.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Controles de Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Página {currentPage} de {totalPages} 
                    <span className="ml-2">
                      ({((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems})
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Números das páginas */}
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNumber)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável
                </label>
                <p className="text-gray-900">
                  {expenseUser?.name || `Usuário ID: ${selectedExpense.userId}`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <p className="text-gray-900">{selectedExpense.item}</p>
              </div>

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