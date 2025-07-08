import { useState, useRef } from "react";
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
import { BANCOS, FORMAS_PAGAMENTO } from "@shared/constants";
import { useContractsAndCategories } from "@/hooks/use-contracts-categories";

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
    bankIssuer: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: contractsCategories } = useContractsAndCategories();

  const contracts = contractsCategories?.contracts || [];
  const categories = contractsCategories?.categories || [];

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
          const result = await apiRequest('/api/upload', 'POST', {
            file: fileData,
            filename: imageFile.name
          });
          imageUrl = result.url;
          
          console.log('Upload concluído, URL:', imageUrl);
        } catch (error) {
          console.error("Erro no upload da imagem:", error);
          console.error("Detalhes do erro:", JSON.stringify(error, null, 2));
          
          // Tentar identificar o tipo específico de erro
          if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as any).message;
            if (errorMessage.includes('401') || errorMessage.includes('Authentication required')) {
              throw new Error("Erro de autenticação no upload. Tente fazer login novamente.");
            } else if (errorMessage.includes('403')) {
              throw new Error("Sem permissão para upload de imagens.");
            }
          }
          
          throw new Error("Falha no upload da imagem. Verifique sua conexão e tente novamente.");
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
      bankIssuer: "",
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
                value={formData.totalValue ? formatCurrency(formData.totalValue) : ""}
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
                  {FORMAS_PAGAMENTO.map((method) => (
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
              <Label htmlFor="bankIssuer">Banco Emissor</Label>
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
              <Label htmlFor="contractNumber">Número do Contrato *</Label>
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
                            // Reset the file input using ref
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
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
                            ref={fileInputRef}
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
