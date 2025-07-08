import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AddContractModal() {
  const [open, setOpen] = useState(false);
  const [contractName, setContractName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addContractMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest('/api/contracts', 'POST', data);
    },
    onSuccess: () => {
      setOpen(false);
      setContractName("");
      setDescription("");
      toast({
        title: "Contrato adicionado",
        description: "O novo contrato foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts-and-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar contrato",
        description: error.message || "Erro ao criar contrato",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contractName.trim()) {
      addContractMutation.mutate({
        name: contractName.trim(),
        description: description.trim() || undefined
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent">
          <Plus className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-700" />
          <div className="flex flex-col items-start">
            <span>Novo Contrato</span>
            <span className="text-xs text-gray-500 mt-0.5">Adicionar contrato</span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Contrato</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para adicionar um novo contrato ao sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-name">Nome do Contrato</Label>
            <Input
              id="contract-name"
              type="text"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="Ex: SECRETARIA DA SAÚDE"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract-description">Descrição (opcional)</Label>
            <Input
              id="contract-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Contrato com a Secretaria da Saúde"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={addContractMutation.isPending || !contractName.trim()}
            >
              {addContractMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}