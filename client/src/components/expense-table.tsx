import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Filter, X, Ban } from "lucide-react";
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
}

export default function ExpenseTable() {
  const [filters, setFilters] = useState<ExpenseFilters>({
    year: "all",
    month: "all",
    category: "all",
    contractNumber: "",
    paymentMethod: "all",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  // Query para despesas com filtros aplicados
  const { data: filteredExpenses = [], isLoading: isLoadingFiltered } = useQuery<Expense[]>({
    queryKey: ['/api/expenses', 'filtered', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.year && filters.year !== "all") params.set('year', filters.year);
      if (filters.month && filters.month !== "all") {
        const monthFilter = filters.year !== "all" ? filters.year + "-" + filters.month : "2025-" + filters.month;
        params.set('month', monthFilter);
      }
      if (filters.category && filters.category !== "all") params.set('category', filters.category);
      if (filters.contractNumber) params.set('contractNumber', filters.contractNumber);
      if (filters.paymentMethod && filters.paymentMethod !== "all") params.set('paymentMethod', filters.paymentMethod);
      
      const response = await apiRequest('GET', `/api/expenses?${params}`);
      return response.json();
    },
    enabled: filters.year !== "all" || filters.month !== "all" || filters.category !== "all" || filters.contractNumber !== "" || filters.paymentMethod !== "all"
  });

  // Query para despesas recentes (sem filtros)
  const { data: recentExpenses = [], isLoading: isLoadingRecent } = useQuery<Expense[]>({
    queryKey: ['/api/expenses', 'recent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/expenses');
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/expenses/${id}`),
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
    mutationFn: (id: string) => apiRequest('PATCH', `/api/expenses/${id}/cancel`),
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

  const isCancelled = (category: string) => {
    return category.startsWith('[CANCELADA]');
  };

  

  const clearFilters = () => {
    setFilters({ year: "all", month: "all", category: "all", contractNumber: "", paymentMethod: "all" });
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 space-y-2 md:space-y-0">
            <div>
              <Label htmlFor="yearFilter">Ano</Label>
              <Select value={filters.year} onValueChange={(value) => setFilters({ ...filters, year: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
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
      {(filters.year !== "all" || filters.month !== "all" || filters.category !== "all" || filters.contractNumber !== "" || filters.paymentMethod !== "all") && (
        <Card className="shadow-sm border-blue-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              📅 Despesas Filtradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingFiltered ? (
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
                          <div>
                            <div className={`font-medium ${isCancelled(expense.category) ? "text-red-600" : ""}`}>
                              {expense.item}
                            </div>
                            <div className="text-sm text-gray-500">ID: #{expense.id.slice(0, 8)}</div>
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
                        {user?.role === "admin" && (
                          <TableCell>
                            <div className="flex gap-2">
                              {!isCancelled(expense.category) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                  onClick={() => handleCancel(expense.id)}
                                  disabled={cancelMutation.isPending}
                                >
                                  <Ban className="h-4 w-4" />
                                  <span className="ml-2 hidden sm:inline">Cancelar</span>
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
                                <span className="ml-2 hidden sm:inline">Excluir</span>
                              </Button>
                            </div>
                          </TableCell>
                        )}
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
          {isLoadingRecent ? (
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
                        <div>
                          <div className={`font-medium ${isCancelled(expense.category) ? "text-red-600" : ""}`}>
                            {expense.item}
                          </div>
                          <div className="text-sm text-gray-500">ID: #{expense.id.slice(0, 8)}</div>
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
                      {user?.role === "admin" && (
                        <TableCell>
                          <div className="flex gap-2">
                            {!isCancelled(expense.category) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCancel(expense.id)}
                                disabled={cancelMutation.isPending}
                                title="Cancelar despesa"
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(expense.id)}
                              disabled={deleteMutation.isPending}
                              title="Excluir despesa"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      
    </div>
  );
}
