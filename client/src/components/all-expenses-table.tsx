import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Ban, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useResponsive } from "@/hooks/use-responsive";
import { formatDateSafely } from "@/lib/date-utils";
import { apiRequest } from "@/lib/queryClient";
import type { Expense, User } from "@shared/schema";

interface AllExpensesTableProps {
  user: User | null;
  filters?: {
    year: string;
    month: string;
    category: string;
    contractNumber: string;
    paymentMethod: string;
    startDate: string;
    endDate: string;
  };
}

export function AllExpensesTable({ user, filters }: AllExpensesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseUser, setExpenseUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { isMobile, isTablet } = useResponsive();

  const itemsPerPage = 100;

  // Query para buscar todas as despesas com paginação e filtros
  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['/api/expenses/paginated', currentPage, itemsPerPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (filters) {
        if (filters.year !== "all") params.append('year', filters.year);
        if (filters.month !== "all") params.append('month', filters.month);
        if (filters.category !== "all") params.append('category', filters.category);
        if (filters.contractNumber !== "all") params.append('contractNumber', filters.contractNumber);
        if (filters.paymentMethod !== "all") params.append('paymentMethod', filters.paymentMethod);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
      }
      
      const response = await fetch(`/api/expenses/paginated?${params.toString()}`);
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

              {/* Controles de Paginação - Responsivo */}
              {totalPages > 1 && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  {/* Informações da página - Mobile/Desktop */}
                  <div className="text-sm text-gray-500 text-center sm:text-left">
                    <span className="block sm:inline">
                      Página {currentPage} de {totalPages}
                    </span>
                    <span className="block sm:inline sm:ml-2">
                      ({((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems})
                    </span>
                  </div>
                  
                  {/* Controles de navegação */}
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      className="hidden sm:inline-flex"
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
                    
                    {/* Números das páginas - Menos no mobile */}
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, totalPages) }, (_, i) => {
                        let pageNumber;
                        const maxPages = window.innerWidth < 640 ? 3 : 5;
                        
                        if (totalPages <= maxPages) {
                          pageNumber = i + 1;
                        } else if (currentPage <= Math.floor(maxPages / 2) + 1) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - Math.floor(maxPages / 2)) {
                          pageNumber = totalPages - maxPages + 1 + i;
                        } else {
                          pageNumber = currentPage - Math.floor(maxPages / 2) + i;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNumber)}
                            className="w-8 h-8 p-0 text-xs sm:text-sm"
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