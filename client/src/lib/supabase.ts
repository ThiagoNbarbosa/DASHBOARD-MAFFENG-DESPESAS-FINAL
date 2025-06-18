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
  console.log('Arquivo selecionado:', file);
  console.log('Nome do arquivo:', file?.name);
  console.log('Tamanho do arquivo:', file?.size);
  console.log('Tipo do arquivo:', file?.type);

  if (!file) {
    throw new Error('Nenhum arquivo fornecido para upload');
  }

  if (!file.name) {
    throw new Error('Arquivo sem nome válido');
  }

  // Converter arquivo para base64
  const reader = new FileReader();
  const fileDataPromise = new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const fileData = await fileDataPromise;
  
  console.log('Enviando arquivo para o servidor...');

  // Enviar para o servidor
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: fileData,
      filename: file.name
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro no upload');
  }

  const result = await response.json();
  console.log('Upload realizado com sucesso! URL:', result.url);
  
  return result.url;
};
