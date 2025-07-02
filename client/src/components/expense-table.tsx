import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Filter, X, Ban, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authApi } from "@/lib/auth";

import type { Expense } from "@shared/schema";

interface ExpenseFilters {
  year: string;
  month: string;
  category: string;
  contractNumber: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  item: string;
}

export default function ExpenseTable() {
  const [filters, setFilters] = useState<ExpenseFilters>({
    year: "all",
    month: "all",
    category: "all",
    contractNumber: "",
    paymentMethod: "all",
    startDate: "",
    endDate: "",
    item: "",
  });
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Função para abrir modal de detalhes
  const handleViewDetails = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDetailsModalOpen(true);
  };

  // Query unificada para despesas (reduz consultas duplicadas)
  const hasActiveFilters = filters.year !== "all" || filters.month !== "all" || filters.category !== "all" || filters.contractNumber !== "" || filters.paymentMethod !== "all" || filters.startDate !== "" || filters.endDate !== "" || filters.item !== "";

  const { data: allExpenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses', hasActiveFilters ? 'filtered' : 'recent', filters],
    queryFn: async () => {
      if (!hasActiveFilters) {
        return await apiRequest('/api/expenses', 'GET');
      }

      const params = new URLSearchParams();
      if (filters.year && filters.year !== "all") params.set('year', filters.year);
      if (filters.month && filters.month !== "all") {
        const monthFilter = filters.year !== "all" ? filters.year + "-" + filters.month : "2025-" + filters.month;
        params.set('month', monthFilter);
      }
      if (filters.category && filters.category !== "all") params.set('category', filters.category);
      if (filters.contractNumber) params.set('contractNumber', filters.contractNumber);
      if (filters.paymentMethod && filters.paymentMethod !== "all") params.set('paymentMethod', filters.paymentMethod);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.item) params.set('item', filters.item);

      return await apiRequest(`/api/expenses?${params}`, 'GET');
    },
  });

  // Separar dados para exibição
  const filteredExpenses = hasActiveFilters ? allExpenses : [];
  const recentExpenses = hasActiveFilters ? [] : allExpenses;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/expenses/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Despesa excluída",
        description: "A despesa foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a despesa.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/expenses/${id}/cancel`, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Despesa cancelada",
        description: "A despesa foi cancelada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar a despesa.",
        variant: "destructive",
      });
    },
  });



  const handleCancel = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar esta despesa?")) {
      cancelMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate(id);
    }
  };

  const isCancelled = (category: string) => {
    return category.startsWith('[CANCELADA]');
  };



  const clearFilters = () => {
    setFilters({ year: "all", month: "all", category: "all", contractNumber: "", paymentMethod: "all", startDate: "", endDate: "", item: "" });
  };

  const categories = [
    "Pagamento funcionários",
    "Material",
    "Mão de Obra",
    "Prestador de serviços",
    "Aluguel de ferramentas",
    "Manutenção em veículo",
  ];

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
      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 space-y-2 md:space-y-0">
            <div>
              <Label htmlFor="itemFilter">Pesquisar Item</Label>
              <Input
                id="itemFilter"
                placeholder="Digite o nome do item..."
                value={filters.item}
                onChange={(e) => setFilters({ ...filters, item: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="yearFilter">Ano</Label>
              <Select value={filters.year} onValueChange={(value) => setFilters({ ...filters, year: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="monthFilter">Mês</Label>
              <Select value={filters.month} onValueChange={(value) => setFilters({ ...filters, month: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthNumber = String(i + 1).padStart(2, '0');
                    const monthName = new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'long' });
                    return (
                      <SelectItem key={monthNumber} value={monthNumber}>
                        {monthName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="categoryFilter">Categoria</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentMethodFilter">Forma de Pagamento</Label>
              <Select value={filters.paymentMethod} onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as formas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as formas</SelectItem>
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Boleto à Vista">Boleto à Vista</SelectItem>
                  <SelectItem value="Boleto a Prazo">Boleto a Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user?.role === "admin" && (
              <div>
                <Label htmlFor="contractFilter">Número do Contrato</Label>
                <Input
                  id="contractFilter"
                  placeholder="Digite o número do contrato"
                  value={filters.contractNumber}
                  onChange={(e) => setFilters({ ...filters, contractNumber: e.target.value })}
                />
              </div>
            )}

            <div>
              <Label htmlFor="startDateFilter">Data Inicial</Label>
              <Input
                id="startDateFilter"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="endDateFilter">Data Final</Label>
              <Input
                id="endDateFilter"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtered Expenses Section */}
      {(filters.year !== "all" || filters.month !== "all" || filters.category !== "all" || filters.contractNumber !== "" || filters.paymentMethod !== "all" || filters.startDate !== "" || filters.endDate !== "" || filters.item !== "") && (
        <Card className="shadow-sm border-blue-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              📅 Despesas Filtradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando despesas filtradas...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma despesa encontrada com os filtros aplicados
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
                      <TableHead>Contrato</TableHead>
                      <TableHead>Data</TableHead>
                      {user?.role === "admin" && <TableHead>Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense: Expense) => (
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
                          {expense.contractNumber}
                        </TableCell>
                        <TableCell className={isCancelled(expense.category) ? "text-red-600" : ""}>
                          {new Date(expense.paymentDate).toLocaleDateString('pt-BR')}
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
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
                                      handleDelete(expense.id);
                                    }
                                  }}
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
            )}
          </CardContent>
        </Card>
      )}

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
                    <TableHead>Contrato</TableHead>
                    <TableHead>Data</TableHead>
                    {user?.role === "admin" && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExpenses.map((expense: Expense) => (
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
                        {expense.contractNumber}
                      </TableCell>
                      <TableCell className={isCancelled(expense.category) ? "text-red-600" : ""}>
                        {new Date(expense.paymentDate).toLocaleDateString('pt-BR')}
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