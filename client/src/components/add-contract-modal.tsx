import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddContractModal() {
  const [open, setOpen] = useState(false);
  const [contractName, setContractName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addContractMutation = useMutation({
    mutationFn: async (name: string) => {
      // Simular adição de contrato - em produção seria uma API real
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { name, id: Date.now() };
    },
    onSuccess: () => {
      setOpen(false);
      setContractName("");
      toast({
        title: "Contrato adicionado",
        description: "O novo contrato foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar contrato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contractName.trim()) {
      addContractMutation.mutate(contractName.trim());
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