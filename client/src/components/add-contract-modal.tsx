import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AddContractModal() {
  const [open, setOpen] = useState(false);
  const [contractName, setContractName] = useState("");
  const [contractCode, setContractCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addContractMutation = useMutation({
    mutationFn: async (data: { name: string; code: string }) => {
      return apiRequest('/api/contracts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      toast({
        title: "Contrato adicionado com sucesso",
        description: `${contractName} foi adicionado ao sistema.`,
      });
      setContractName("");
      setContractCode("");
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar contrato",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractName.trim() || !contractCode.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e código do contrato.",
        variant: "destructive",
      });
      return;
    }
    addContractMutation.mutate({ name: contractName, code: contractCode });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start h-auto p-3 border-gray-200 hover:bg-gray-50"
        >
          <Building2 className="mr-3 h-4 w-4 text-gray-500" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Adicionar Contrato</span>
            <span className="text-xs text-gray-500">Novo contrato empresarial</span>
          </div>
          <Plus className="ml-auto h-4 w-4 text-gray-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Adicionar Novo Contrato
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contractName">Nome do Contrato</Label>
            <Input
              id="contractName"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="Ex: Secretaria da Administração"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractCode">Código do Contrato</Label>
            <Input
              id="contractCode"
              value={contractCode}
              onChange={(e) => setContractCode(e.target.value)}
              placeholder="Ex: SECAD-2025"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addContractMutation.isPending}
            >
              {addContractMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}