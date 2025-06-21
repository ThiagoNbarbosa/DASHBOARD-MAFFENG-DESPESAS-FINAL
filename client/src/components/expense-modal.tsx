import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { uploadImage } from "@/lib/supabase";
import type { InsertExpense } from "@shared/schema";

interface ExpenseFormData extends Omit<InsertExpense, 'paymentDate' | 'value'> {
  paymentDate: string;
}

export default function ExpenseModal() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>({
    item: "",
    paymentMethod: "",
    category: "",
    contractNumber: "",
    totalValue: "",
    imageUrl: "",
    paymentDate: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      let imageUrl = "";
      
      console.log('Estado do imageFile antes do upload:', imageFile);
      console.log('Dados do formulário:', data);
      
      if (imageFile) {
        try {
          console.log('Iniciando processo de upload...');
          
          // Converter arquivo para base64
          const reader = new FileReader();
          const fileDataPromise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });

          const fileData = await fileDataPromise;
          
          console.log('Enviando arquivo para o servidor...');

          // Enviar para o servidor backend que tem service role key
          const uploadResponse = await apiRequest('POST', '/api/upload', {
            file: fileData,
            filename: imageFile.name
          });

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.message || 'Erro no upload');
          }

          const result = await uploadResponse.json();
          imageUrl = result.url;
          
          console.log('Upload concluído, URL:', imageUrl);
        } catch (error) {
          console.error("Erro no upload da imagem:", error);
          throw new Error("Falha no upload da imagem");
        }
      } else {
        console.error('Nenhum arquivo de imagem selecionado');
        throw new Error("Nenhum arquivo selecionado");
      }

      const expenseData = {
        ...data,
        value: data.totalValue,
        imageUrl,
        paymentDate: new Date(data.paymentDate).toISOString(),
      };

      return await apiRequest('/api/expenses', 'POST', expenseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      // Use setTimeout to ensure DOM is stable before showing toast
      setTimeout(() => {
        toast({
          title: "Despesa criada",
          description: "A despesa foi criada com sucesso.",
        });
      }, 100);
      
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Erro ao criar despesa:", error);
      
      // Use setTimeout to ensure DOM is stable before showing toast
      setTimeout(() => {
        toast({
          title: "Erro ao criar despesa",
          description: error.message || "Não foi possível criar a despesa.",
          variant: "destructive",
        });
      }, 100);
    },
  });

  const resetForm = () => {
    setFormData({
      item: "",
      paymentMethod: "",
      category: "",
      contractNumber: "",
      totalValue: "",
      imageUrl: "",
      paymentDate: "",
    });
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      setTimeout(() => {
        toast({
          title: "Imagem obrigatória",
          description: "Por favor, selecione uma imagem do comprovante.",
          variant: "destructive",
        });
      }, 100);
      return;
    }

    createExpenseMutation.mutate(formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Converte para centavos
    const cents = parseFloat(numbers) / 100;
    
    // Formata como moeda brasileira
    return cents.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleTotalValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = (parseFloat(rawValue) / 100).toFixed(2);
    
    setFormData({ 
      ...formData, 
      totalValue: rawValue ? numericValue : ""
    });
  };

  const categories = [
    "Pagamento funcionários",
    "Material",
    "Mão de Obra",
    "Prestador de serviços",
    "Aluguel de ferramentas",
    "Manutenção em veículo",
  ];

  const paymentMethods = [
    "Pix",
    "Cartão de Crédito",
    "Boleto à Vista",
    "Boleto a Prazo",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
          <DialogDescription>
            Preencha os dados da nova despesa e faça o upload do comprovante.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item">Item *</Label>
              <Input
                id="item"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                placeholder="Descrição do item"
                required
              />
            </div>

            <div>
              <Label htmlFor="totalValue">Valor Total *</Label>
              <Input
                id="totalValue"
                type="text"
                value={formData.totalValue ? formatCurrency((parseFloat(formData.totalValue) * 100).toString()) : ""}
                onChange={handleTotalValueChange}
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
              <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Categoria *</Label>
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
              <Label htmlFor="contractNumber">Número do Contrato *</Label>
              <Input
                id="contractNumber"
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                placeholder="Ex: CT-2024-001"
                required
              />
            </div>

            

            <div>
              <Label htmlFor="paymentDate">Data de Pagamento *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="image">Comprovante (Imagem) *</Label>
            <div className="mt-2">
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="space-y-2 relative">
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview("");
                            // Reset the file input
                            const fileInput = document.getElementById('image') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
                          title="Remover imagem"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">{imageFile?.name}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="image" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80">
                          <span>Enviar um arquivo</span>
                          <input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="sr-only"
                            required
                          />
                        </label>
                        <p className="pl-1">ou arraste e solte</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createExpenseMutation.isPending}
            >
              {createExpenseMutation.isPending ? "Salvando..." : "Salvar Despesa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
