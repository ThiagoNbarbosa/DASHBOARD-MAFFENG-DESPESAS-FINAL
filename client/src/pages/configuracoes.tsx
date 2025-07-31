import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Edit, Trash2, Building, Tag, AlertTriangle } from "lucide-react";
import { CONTRATOS, CATEGORIAS } from "@shared/constants";
import { useContractsAndCategories } from "@/hooks/use-contracts-categories";

export default function Configuracoes() {
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddContractModalOpen, setIsAddContractModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [isEditContractModalOpen, setIsEditContractModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id?: number; name: string } | null>(null);
  const [editingContract, setEditingContract] = useState<{ id?: number; name: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newContractName, setNewContractName] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  // Hook para buscar contratos e categorias completos
  const { data: contractsAndCategories, isLoading: dataLoading } = useContractsAndCategories();

  // Buscar categorias dinâmicas do banco
  const { data: dynamicCategories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest('/api/categories', 'GET'),
  });

  // Buscar contratos dinâmicos do banco
  const { data: dynamicContracts = [] } = useQuery({
    queryKey: ['/api/contracts'],
    queryFn: () => apiRequest('/api/contracts', 'GET'),
  });

  // Mutations
  const addCategoryMutation = useMutation({
    mutationFn: (name: string) => apiRequest('/api/categories', 'POST', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts-and-categories'] });
      setIsAddCategoryModalOpen(false);
      setNewCategoryName("");
      toast({ title: "Categoria adicionada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar categoria", variant: "destructive" });
    }
  });

  const addContractMutation = useMutation({
    mutationFn: (name: string) => apiRequest('/api/contracts', 'POST', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts-and-categories'] });
      setIsAddContractModalOpen(false);
      setNewContractName("");
      toast({ title: "Contrato adicionado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar contrato", variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => 
      apiRequest(`/api/categories/${id}`, 'PUT', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts-and-categories'] });
      setIsEditCategoryModalOpen(false);
      setEditingCategory(null);
      toast({ title: "Categoria atualizada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar categoria", variant: "destructive" });
    }
  });

  const updateContractMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => 
      apiRequest(`/api/contracts/${id}`, 'PUT', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts-and-categories'] });
      setIsEditContractModalOpen(false);
      setEditingContract(null);
      toast({ title: "Contrato atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar contrato", variant: "destructive" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/categories/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts-and-categories'] });
      toast({ title: "Categoria removida com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover categoria", variant: "destructive" });
    }
  });

  const deleteContractMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/contracts/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts-and-categories'] });
      toast({ title: "Contrato removido com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover contrato", variant: "destructive" });
    }
  });

  // Handlers
  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategoryMutation.mutate(newCategoryName.trim());
    }
  };

  const handleAddContract = () => {
    if (newContractName.trim()) {
      addContractMutation.mutate(newContractName.trim());
    }
  };

  const handleEditCategory = (category: { id: number; name: string }) => {
    setEditingCategory(category);
    setIsEditCategoryModalOpen(true);
  };

  const handleEditContract = (contract: { id: number; name: string }) => {
    setEditingContract(contract);
    setIsEditContractModalOpen(true);
  };

  const handleUpdateCategory = () => {
    if (editingCategory && editingCategory.id && editingCategory.name.trim()) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        name: editingCategory.name.trim()
      });
    }
  };

  const handleUpdateContract = () => {
    if (editingContract && editingContract.id && editingContract.name.trim()) {
      updateContractMutation.mutate({
        id: editingContract.id,
        name: editingContract.name.trim()
      });
    }
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleDeleteContract = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.')) {
      deleteContractMutation.mutate(id);
    }
  };

  if (userLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoading />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 ml-0 lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="h-6 w-6 text-orange-600" />
                  Configurações do Sistema
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gerencie categorias e contratos do sistema
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Categorias Fixas</p>
                    <p className="text-2xl font-bold text-blue-600">{CATEGORIAS.length}</p>
                  </div>
                  <Tag className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Categorias Dinâmicas</p>
                    <p className="text-2xl font-bold text-green-600">{dynamicCategories.length}</p>
                  </div>
                  <Tag className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contratos Fixos</p>
                    <p className="text-2xl font-bold text-purple-600">{CONTRATOS.length}</p>
                  </div>
                  <Building className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contratos Dinâmicos</p>
                    <p className="text-2xl font-bold text-orange-600">{dynamicContracts.length}</p>
                  </div>
                  <Building className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Categorias */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Gerenciar Categorias
                </CardTitle>
                <Dialog open={isAddCategoryModalOpen} onOpenChange={setIsAddCategoryModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Nova Categoria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="categoryName">Nome da Categoria</Label>
                        <Input
                          id="categoryName"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Digite o nome da categoria"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddCategoryModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleAddCategory}
                          disabled={addCategoryMutation.isPending || !newCategoryName.trim()}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Categorias Fixas */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Categorias Fixas (Sistema)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {CATEGORIAS.map((category, index) => (
                      <Badge key={index} variant="secondary" className="justify-center p-2">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Categorias Dinâmicas */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Categorias Personalizadas</h3>
                  {dynamicCategories.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Data de Criação</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dynamicCategories.map((category: any) => (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell>
                              {new Date(category.createdAt).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeleteCategory(category.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nenhuma categoria personalizada criada ainda.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contratos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Gerenciar Contratos
                </CardTitle>
                <Dialog open={isAddContractModalOpen} onOpenChange={setIsAddContractModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Contrato
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Contrato</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="contractName">Nome do Contrato</Label>
                        <Input
                          id="contractName"
                          value={newContractName}
                          onChange={(e) => setNewContractName(e.target.value)}
                          placeholder="Digite o nome do contrato"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddContractModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleAddContract}
                          disabled={addContractMutation.isPending || !newContractName.trim()}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Contratos Fixos */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Contratos Fixos (Sistema)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {CONTRATOS.map((contract, index) => (
                      <Badge key={index} variant="outline" className="justify-center p-2 text-xs">
                        {contract}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Contratos Dinâmicos */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Contratos Personalizados</h3>
                  {dynamicContracts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Data de Criação</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dynamicContracts.map((contract: any) => (
                          <TableRow key={contract.id}>
                            <TableCell className="font-medium">{contract.name}</TableCell>
                            <TableCell>
                              {new Date(contract.createdAt).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditContract(contract)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeleteContract(contract.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nenhum contrato personalizado criado ainda.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Modal de Edição de Categoria */}
        <Dialog open={isEditCategoryModalOpen} onOpenChange={setIsEditCategoryModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editCategoryName">Nome da Categoria</Label>
                <Input
                  id="editCategoryName"
                  value={editingCategory?.name || ""}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Digite o nome da categoria"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditCategoryModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateCategory}
                  disabled={updateCategoryMutation.isPending || !editingCategory?.name.trim()}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição de Contrato */}
        <Dialog open={isEditContractModalOpen} onOpenChange={setIsEditContractModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Contrato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editContractName">Nome do Contrato</Label>
                <Input
                  id="editContractName"
                  value={editingContract?.name || ""}
                  onChange={(e) => setEditingContract(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Digite o nome do contrato"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditContractModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateContract}
                  disabled={updateContractMutation.isPending || !editingContract?.name.trim()}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}