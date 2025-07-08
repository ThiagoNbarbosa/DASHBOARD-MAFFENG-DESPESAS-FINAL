
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Expense } from "@shared/schema";
import { BANCOS, FORMAS_PAGAMENTO } from "@shared/constants";
import { useContractsAndCategories } from "@/hooks/use-contracts-categories";
import { dateToInputValue } from "@/lib/date-utils";

interface EditExpenseModalProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExpenseFormData {
  item: string;
  paymentMethod: string;
  category: string;
  contractNumber: string;
  totalValue: string;
  paymentDate: string;
  bankIssuer: string;
}

export default function EditExpenseModal({ expense, open, onOpenChange }: EditExpenseModalProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    item: "",
    paymentMethod: "",
    category: "",
    contractNumber: "",
    totalValue: "",
    paymentDate: "",
    bankIssuer: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: contractsCategories } = useContractsAndCategories();

  const contracts = contractsCategories?.contracts || [];
  const categories = contractsCategories?.categories || [];

  // Populate form when expense changes
  useEffect(() => {
    if (expense) {
      setFormData({
        item: expense.item,
        paymentMethod: expense.paymentMethod,
        category: expense.category,
        contractNumber: expense.contractNumber,
        totalValue: expense.value,
        paymentDate: dateToInputValue(expense.paymentDate),
        bankIssuer: expense.bankIssuer || "",
      });
    }
  }, [expense]);

  const updateExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      if (!expense) throw new Error("No expense to update");

      const expenseData = {
        ...data,
        value: data.totalValue,
        paymentDate: new Date(data.paymentDate).toISOString(),
      };

      return await apiRequest(`/api/expenses/${expense.id}`, 'PUT', expenseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      setTimeout(() => {
        toast({
          title: "Despesa atualizada",
          description: "A despesa foi atualizada com sucesso.",
        });
      }, 100);
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar despesa:", error);
      
      setTimeout(() => {
        toast({
          title: "Erro ao atualizar despesa",
          description: error.message || "Não foi possível atualizar a despesa.",
          variant: "destructive",
        });
      }, 100);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateExpenseMutation.mutate(formData);
  };

  const formatCurrency = (value: string) => {
    if (!value) return "";
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return "";
    
    return numericValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  const handleTotalValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/\D/g, '');
    if (numericValue === '') {
      setFormData({ ...formData, totalValue: '' });
    } else {
      const decimalValue = (parseInt(numericValue) / 100).toFixed(2);
      setFormData({ ...formData, totalValue: decimalValue });
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Despesa</DialogTitle>
          <DialogDescription>
            Atualize as informações da despesa selecionada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-item">Item *</Label>
              <Input
                id="edit-item"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                placeholder="Descrição do item"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-totalValue">Valor Total *</Label>
              <Input
                id="edit-totalValue"
                type="text"
                value={formData.totalValue ? formatCurrency(formData.totalValue) : ""}
                onChange={handleTotalValueChange}
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-paymentMethod">Forma de Pagamento *</Label>
              <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-contractNumber">Número do Contrato *</Label>
              <Select value={formData.contractNumber} onValueChange={(value) => setFormData({ ...formData, contractNumber: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contrato) => (
                    <SelectItem key={contrato} value={contrato}>
                      {contrato}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-bankIssuer">Banco Emissor</Label>
              <Select value={formData.bankIssuer || ""} onValueChange={(value) => setFormData({ ...formData, bankIssuer: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco emissor" />
                </SelectTrigger>
                <SelectContent>
                  {BANCOS.map((banco) => (
                    <SelectItem key={banco} value={banco}>
                      {banco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-paymentDate">Data de Pagamento *</Label>
              <Input
                id="edit-paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
              />
            </div>
          </div>

          {expense?.imageUrl && (
            <div>
              <Label>Comprovante Atual</Label>
              <div className="mt-2">
                <img
                  src={expense.imageUrl}
                  alt="Comprovante"
                  className="max-w-xs max-h-48 object-contain rounded-lg border"
                />
                <p className="text-sm text-gray-500 mt-1">
                  * Para alterar o comprovante, será necessário criar uma nova despesa
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateExpenseMutation.isPending}
            >
              {updateExpenseMutation.isPending ? "Atualizando..." : "Atualizar Despesa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
