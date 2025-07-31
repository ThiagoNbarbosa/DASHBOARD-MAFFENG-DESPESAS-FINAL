import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AddCategoryModal() {
  const [open, setOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addCategoryMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return await apiRequest('/api/categories', 'POST', data);
    },
    onSuccess: () => {
      setOpen(false);
      setCategoryName("");
      toast({
        title: "Categoria adicionada",
        description: "A nova categoria foi criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts-and-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar categoria",
        description: error.message || "Erro ao criar categoria",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim()) {
      addCategoryMutation.mutate({
        name: categoryName.trim()
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent">
          <Plus className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-700" />
          <div className="flex flex-col items-start">
            <span>Nova Categoria</span>
            <span className="text-xs text-gray-500 mt-0.5">Adicionar categoria</span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Categoria</DialogTitle>
          <DialogDescription>
            Digite o nome da categoria.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome da Categoria</Label>
            <Input
              id="category-name"
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ex: MATERIAL DE LIMPEZA"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={addCategoryMutation.isPending || !categoryName.trim()}
            >
              {addCategoryMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}