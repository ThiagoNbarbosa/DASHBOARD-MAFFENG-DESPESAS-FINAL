import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const uploadImage = async (file: File): Promise<string> => {
  // Debug: Inspecionar o objeto da imagem
  console.log('Arquivo selecionado:', file);
  console.log('Nome do arquivo:', file?.name);
  console.log('Tamanho do arquivo:', file?.size);
  console.log('Tipo do arquivo:', file?.type);

  // Verificar se o file não é null
  if (!file) {
    throw new Error('Nenhum arquivo fornecido para upload');
  }

  // Verificar se o arquivo tem nome
  if (!file.name) {
    throw new Error('Arquivo sem nome válido');
  }

  // Autenticação antes do upload
  await supabase.auth.refreshSession();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Nenhum usuário autenticado');
  }

  console.log('Usuário autenticado:', user.email);

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `receipts/${fileName}`;

  // Debug: Verificar se o filePath está correto
  console.log('Extensão do arquivo:', fileExt);
  console.log('Nome final do arquivo:', fileName);
  console.log('Caminho completo (filePath):', filePath);

  // Verificar se o filePath não está vazio
  if (!filePath || filePath === 'receipts/') {
    throw new Error('Caminho do arquivo inválido');
  }

  console.log('Iniciando upload para o Supabase...');

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Erro detalhado do upload:', uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  console.log('Upload realizado com sucesso!');

  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(filePath);

  console.log('URL pública gerada:', publicUrl);

  return publicUrl;
};
