import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tag } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AddCategoryModal() {
  const [open, setOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addCategoryMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return apiRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Categoria adicionada com sucesso",
        description: `${categoryName} foi adicionada ao sistema.`,
      });
      setCategoryName("");
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar categoria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o nome da categoria.",
        variant: "destructive",
      });
      return;
    }
    addCategoryMutation.mutate({ name: categoryName });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          <Tag className="mr-3 h-4 w-4 text-gray-500" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Adicionar Categoria</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Adicionar Nova Categoria
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Nome da Categoria</Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ex: Material de Escritório"
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
              disabled={addCategoryMutation.isPending}
            >
              {addCategoryMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}