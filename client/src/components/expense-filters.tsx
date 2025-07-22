import React, { useState, useCallback, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { FORMAS_PAGAMENTO } from "@shared/constants";
import { useContractsAndCategories } from "@/hooks/use-contracts-categories";
import { useResponsive } from "@/hooks/use-responsive";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ErrorBoundary from "@/components/error-boundary";
import type { User } from "@shared/schema";

interface ExpenseFiltersProps {
  filters: {
    year: string;
    month: string;
    category: string;
    contractNumber: string;
    paymentMethod: string;
    startDate: string;
    endDate: string;
  };
  setFilters: (filters: any) => void;
  clearFilters: () => void;
  user: User | null;
}

// Componente de filtro mobile simplificado
function MobileFilterGrid({ 
  filters, 
  contracts, 
  categories, 
  onFilterChange, 
  onClearFilters 
}: {
  filters: any;
  contracts: string[];
  categories: string[];
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Ano e Mês em linha */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="yearFilter">Ano</Label>
          <Select value={filters.year} onValueChange={(value) => onFilterChange('year', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="monthFilter">Mês</Label>
          <Select value={filters.month} onValueChange={(value) => onFilterChange('month', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Array.from({ length: 12 }, (_, i) => {
                const monthNumber = String(i + 1).padStart(2, '0');
                const monthName = new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'short' });
                return (
                  <SelectItem key={monthNumber} value={monthNumber}>
                    {monthName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categoria */}
      <div>
        <Label htmlFor="categoryFilter">Categoria</Label>
        <Select value={filters.category} onValueChange={(value) => onFilterChange('category', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((category: string) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Forma de Pagamento */}
      <div>
        <Label htmlFor="paymentMethodFilter">Pagamento</Label>
        <Select value={filters.paymentMethod} onValueChange={(value) => onFilterChange('paymentMethod', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {FORMAS_PAGAMENTO.map((method: string) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contrato */}
      <div>
        <Label htmlFor="contractFilter">Contrato</Label>
        <Select value={filters.contractNumber} onValueChange={(value) => onFilterChange('contractNumber', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Contrato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {contracts.map((contract: string) => (
              <SelectItem key={contract} value={contract}>
                {contract}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Botão limpar */}
      <Button variant="outline" onClick={onClearFilters} className="w-full">
        <X className="h-4 w-4 mr-2" />
        Limpar Filtros
      </Button>
    </div>
  );
}

export function ExpenseFilters({ filters, setFilters, clearFilters, user }: ExpenseFiltersProps) {
  const { data: contractsCategories, isLoading } = useContractsAndCategories();
  const { isMobile } = useResponsive();
  const [isExpanded, setIsExpanded] = useState(!isMobile);

  // Safely access contracts and categories
  const contracts = useMemo(() => {
    if (!contractsCategories || typeof contractsCategories !== 'object') return [];
    const contractsData = (contractsCategories as any).contracts;
    if (Array.isArray(contractsData)) {
      return contractsData.map((c: any) => typeof c === 'string' ? c : c?.name || '').filter(Boolean);
    }
    return [];
  }, [contractsCategories]);

  const categories = useMemo(() => {
    if (!contractsCategories || typeof contractsCategories !== 'object') return [];
    const categoriesData = (contractsCategories as any).categories;
    if (Array.isArray(categoriesData)) {
      return categoriesData.map((c: any) => typeof c === 'string' ? c : c?.name || '').filter(Boolean);
    }
    return [];
  }, [contractsCategories]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  }, [filters, setFilters]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <div className="text-sm text-gray-500">Carregando filtros...</div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <ErrorBoundary>
        <div className="space-y-4">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Filtros
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <MobileFilterGrid 
                filters={filters}
                contracts={contracts}
                categories={categories}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <Label htmlFor="yearFilter">Ano</Label>
            <Select value={filters.year} onValueChange={(value) => setFilters({ ...filters, year: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
                <SelectItem value="2028">2028</SelectItem>
                <SelectItem value="2029">2029</SelectItem>
                <SelectItem value="2030">2030</SelectItem>
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
                {categories.map((category: string) => (
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
                {FORMAS_PAGAMENTO.map((method: string) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contractFilter">Contrato</Label>
            <Select value={filters.contractNumber} onValueChange={(value) => setFilters({ ...filters, contractNumber: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os contratos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os contratos</SelectItem>
                {contracts.map((contract: string) => (
                  <SelectItem key={contract} value={contract}>
                    {contract}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Data Inicial</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endDate">Data Final</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}