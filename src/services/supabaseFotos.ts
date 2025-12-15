import { supabase } from './supabaseClient';

export async function salvarFoto({ 
  image_url, 
  legenda, 
  user_id, 
  latitude, 
  longitude 
}: { 
  image_url: string, 
  legenda: string, 
  user_id: string,
  latitude?: number,
  longitude?: number
}) {
  // Salva metadados da foto na tabela 'fotos'
  const { data, error } = await supabase.from('fotos').insert([
    { 
      image_url, 
      legenda, 
      user_id, 
      data: new Date().toISOString(),
      latitude: latitude || null,
      longitude: longitude || null
    }
  ]);
  return { data, error };
}

export async function listarFotos(user_id: string) {
  return await supabase.from('fotos').select('*').eq('user_id', user_id).order('data', { ascending: false });
}

export async function listarFotosStorage(user_id: string) {
  // Buscar fotos da tabela 'fotos' do banco de dados
  const { data, error } = await supabase
    .from('fotos')
    .select('*')
    .eq('user_id', user_id)
    .order('data', { ascending: false });

  if (error) {
    console.error('Erro ao buscar fotos:', error);
    return { data: null, error };
  }

  // Mapear os dados para o formato esperado pela galeria
  const userPhotos = (data || []).map(foto => ({
    id: foto.id.toString(),
    uri: foto.image_url,
    legenda: foto.legenda || '',
    data: new Date(foto.data).toLocaleDateString(),
    local: '',
    latitude: foto.latitude,
    longitude: foto.longitude,
    created_at: Math.floor(new Date(foto.data).getTime() / 1000)
  }));

  return { data: userPhotos, error: null };
}

export async function deletarFotoStorage(fotoId: string, user_id: string) {
  // Buscar a foto para obter o nome do arquivo no Storage
  const { data: foto, error: fetchError } = await supabase
    .from('fotos')
    .select('image_url')
    .eq('id', fotoId)
    .single();

  if (fetchError || !foto) {
    return { data: null, error: fetchError };
  }

  // Extrair o nome do arquivo da URL
  const fileName = foto.image_url.split('/').pop();
  
  // Deletar o arquivo do Storage
  if (fileName) {
    await supabase.storage.from('fotos').remove([fileName]);
  }

  // Deletar o registro da tabela
  const { data, error } = await supabase
    .from('fotos')
    .delete()
    .eq('id', fotoId);

  return { data, error };
}

export async function atualizarLegendaFoto(fotoId: string, legenda: string) {
  const { data, error } = await supabase
    .from('fotos')
    .update({ legenda })
    .eq('id', fotoId);

  return { data, error };
}
