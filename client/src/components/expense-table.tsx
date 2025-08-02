import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileSelect } from "./mobile-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Filter, X, Ban, Eye, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authApi } from "@/lib/auth";
import { formatDateSafely } from "@/lib/date-utils";
import { ModernFilters } from "@/components/ui/modern-filters";

import type { Expense } from "@shared/schema";
import { BANCOS, FORMAS_PAGAMENTO } from "@shared/constants";
import { useContractsAndCategories } from "@/hooks/use-contracts-categories";
import EditExpenseModal from "./edit-expense-modal";

interface ExpenseFilters {
  year: string;
  month: string;
  category: string;
  contractNumber: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  search: string;
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
    search: "",
  });
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  const { data: contractsCategories } = useContractsAndCategories();
  const contracts = contractsCategories?.contracts || [];
  const categories = contractsCategories?.categories || [];

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
  const hasActiveFilters = filters.year !== "all" || filters.month !== "all" || filters.category !== "all" || filters.contractNumber !== "" || filters.paymentMethod !== "all" || filters.startDate !== "" || filters.endDate !== "" || filters.search !== "";

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
      if (filters.search) params.set('search', filters.search);

      return await apiRequest(`/api/expenses?${params}`, 'GET');
    },
  });

  // Separar dados para exibição
  const filteredExpenses = hasActiveFilters ? allExpenses : [];
  const recentExpenses = hasActiveFilters ? [] : allExpenses;

  // Preparar opções de filtro para o componente ModernFilters
  const filterOptions = [
    {
      key: "year",
      label: "Ano",
      placeholder: "Selecione o ano",
      options: [
        { value: "all", label: "Todos os anos" },
        { value: "2024", label: "2024" },
        { value: "2025", label: "2025" },
        { value: "2026", label: "2026" }
      ]
    },
    {
      key: "month",
      label: "Mês",  
      placeholder: "Todos os meses",
      options: [
        { value: "all", label: "Todos os meses" },
        ...Array.from({ length: 12 }, (_, i) => {
          const monthNumber = String(i + 1).padStart(2, '0');
          const monthName = new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'long' });
          return { value: monthNumber, label: monthName };
        })
      ]
    },
    {
      key: "category",
      label: "Categoria",
      placeholder: "Todas as categorias", 
      options: [
        { value: "all", label: "Todas as categorias" },
        ...categories.map(category => ({ value: category, label: category }))
      ]
    },
    {
      key: "paymentMethod",
      label: "Forma de Pagamento",
      placeholder: "Todas as formas",
      options: [
        { value: "all", label: "Todas as formas" },
        ...FORMAS_PAGAMENTO.map(method => ({ value: method, label: method }))
      ]
    },
    ...(user?.role === "admin" ? [{
      key: "contractNumber" as const,
      label: "Contrato",
      placeholder: "Todos os contratos",
      options: [
        { value: "all", label: "Todos os contratos" },
        ...contracts.map(contract => ({ value: contract, label: contract }))
      ]
    }] : [])
  ];

  const handleFilterChange = (newFilters: Partial<ExpenseFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };


  const isCancelled = (category: string) => {
    return category.startsWith('[CANCELADA]');
  };



  const clearFilters = () => {
    setFilters({ year: "all", month: "all", category: "all", contractNumber: "", paymentMethod: "all", startDate: "", endDate: "", search: "" });
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Modern Filters */}
      <ModernFilters
        filters={filters as any}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
        searchPlaceholder="Buscar por item, categoria, contrato ou descrição..."
        showExport={false}
        title="Filtros"
      />

      {/* Filtered Expenses Section */}
      {hasActiveFilters && (
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
                      <TableHead>Banco Emissor</TableHead>
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
                    <TableHead>Banco Emissor</TableHead>
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