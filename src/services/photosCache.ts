import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';

let db: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

// Inicializar o banco de dados de cache de fotos
export const initPhotosCache = async () => {
  // Se já está inicializado, retornar
  if (db) return;
  
  // Se está inicializando, esperar a inicialização atual
  if (isInitializing && initPromise) {
    await initPromise;
    return;
  }
  
  isInitializing = true;
  
  initPromise = (async () => {
    try {
      db = await SQLite.openDatabaseAsync('photos_cache.db');
      
      // Criar tabela de fotos em cache
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS photos_cache (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          uri TEXT NOT NULL,
          local_path TEXT NOT NULL,
          legenda TEXT,
          data TEXT NOT NULL,
          local TEXT,
          latitude REAL,
          longitude REAL,
          created_at INTEGER NOT NULL,
          cached_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_id ON photos_cache(user_id);
        CREATE INDEX IF NOT EXISTS idx_created_at ON photos_cache(created_at DESC);
      `);
      
      // Migração: adicionar coluna created_at se não existir
      try {
        await db.execAsync(`
          ALTER TABLE photos_cache ADD COLUMN created_at INTEGER;
        `);
        console.log('Coluna created_at adicionada');
      } catch (error) {
        // Coluna já existe, ignorar erro
      }
      
      // Atualizar created_at de registros antigos (usar cached_at como fallback)
      try {
        await db.execAsync(`
          UPDATE photos_cache 
          SET created_at = cached_at 
          WHERE created_at IS NULL;
        `);
      } catch (error) {
        console.log('Erro ao atualizar created_at:', error);
      }
      
      console.log('Cache de fotos inicializado');
    } catch (error) {
      console.error('Erro ao inicializar cache de fotos:', error);
      db = null;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();
  
  await initPromise;
};

// Salvar foto no cache
export const cachePhoto = async (photo: {
  id: string;
  user_id: string;
  uri: string;
  legenda: string;
  data: string;
  local: string;
  latitude?: number;
  longitude?: number;
}) => {
  if (!db) await initPhotosCache();
  
  try {
    // Criar diretório de cache se não existir
    const dirPath = `${FileSystem.documentDirectory}photos_cache/`;
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
    
    // Nome do arquivo
    const fileExtension = photo.uri.split('.').pop() || 'jpg';
    const localPath = `${dirPath}${photo.id}.${fileExtension}`;
    
    // Baixar a imagem
    let downloadSuccess = false;
    
    try {
      const downloadResult = await FileSystem.downloadAsync(photo.uri, localPath);
      if (downloadResult.status === 200) {
        downloadSuccess = true;
        console.log('Imagem baixada com sucesso:', photo.id);
      }
    } catch (downloadError) {
      console.log('Erro ao baixar imagem para', photo.id, ':', downloadError);
    }
    
    // Se não conseguiu baixar, usar a URI original como fallback
    const pathToSave = downloadSuccess ? localPath : photo.uri;
    
    // Garantir que o banco está inicializado
    if (!db) {
      console.log('Banco não inicializado, pulando cache da foto:', photo.id);
      return;
    }
    
    // Verificar se a foto já existe
    const existing = await db.getFirstAsync(
      'SELECT id FROM photos_cache WHERE id = ?',
      [photo.id]
    );
    
    if (existing) {
      // Atualizar
      await db.runAsync(
        `UPDATE photos_cache 
         SET uri = ?, local_path = ?, legenda = ?, data = ?, local = ?, latitude = ?, longitude = ?, cached_at = strftime('%s', 'now')
         WHERE id = ?`,
        [photo.uri, pathToSave, photo.legenda, photo.data, photo.local, photo.latitude || null, photo.longitude || null, photo.id]
      );
      console.log('Foto atualizada no cache:', photo.id);
    } else {
      // Inserir - usar created_at do servidor se disponível, senão usar timestamp atual
      const createdAt = (photo as any).created_at || Math.floor(Date.now() / 1000);
      await db.runAsync(
        `INSERT INTO photos_cache (id, user_id, uri, local_path, legenda, data, local, latitude, longitude, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [photo.id, photo.user_id, photo.uri, pathToSave, photo.legenda, photo.data, photo.local, photo.latitude || null, photo.longitude || null, createdAt]
      );
      console.log('Foto inserida no cache:', photo.id);
    }
  } catch (error) {
    console.error('Erro ao salvar foto no cache:', error);
  }
};

// Salvar múltiplas fotos no cache
export const cacheMultiplePhotos = async (photos: Array<{
  id: string;
  user_id: string;
  uri: string;
  legenda: string;
  data: string;
  local: string;
  latitude?: number;
  longitude?: number;
}>) => {
  for (const photo of photos) {
    await cachePhoto(photo);
  }
};

// Obter fotos do cache
export const getCachedPhotos = async (userId: string): Promise<Array<{
  id: string;
  uri: string;
  legenda: string;
  data: string;
  local: string;
  latitude?: number;
  longitude?: number;
}>> => {
  if (!db) await initPhotosCache();
  
  // Verificar novamente após inicialização
  if (!db) {
    console.log('Banco não disponível após inicialização');
    return [];
  }
  
  try {
    const results = await db.getAllAsync<{
      id: string;
      local_path: string;
      uri: string;
      legenda: string;
      data: string;
      local: string;
      latitude: number | null;
      longitude: number | null;
    }>('SELECT * FROM photos_cache WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    
    if (!results) return [];
    
    console.log(`Encontradas ${results.length} fotos no cache para usuário ${userId}`);
    
    // Verificar quais fotos existem localmente e retornar o caminho correto
    const photos = await Promise.all(results.map(async (photo) => {
      try {
        // Só verifica arquivo local se o local_path não for uma URL
        if (photo.local_path.startsWith('http')) {
          console.log(`Foto ${photo.id} não foi baixada, usando URL original`);
          return {
            id: photo.id,
            uri: photo.local_path,
            legenda: photo.legenda,
            data: photo.data,
            local: photo.local,
            latitude: photo.latitude ?? undefined,
            longitude: photo.longitude ?? undefined,
          };
        }
        
        // Verificar se arquivo existe
        const fileInfo = await FileSystem.getInfoAsync(photo.local_path);
        
        if (fileInfo.exists) {
          console.log(`Foto ${photo.id} encontrada localmente em ${photo.local_path}`);
        } else {
          console.log(`Foto ${photo.id} NÃO encontrada em ${photo.local_path}, usando URL original`);
        }
        
        return {
          id: photo.id,
          uri: fileInfo.exists ? photo.local_path : photo.uri,
          legenda: photo.legenda,
          data: photo.data,
          local: photo.local,
          latitude: photo.latitude ?? undefined,
          longitude: photo.longitude ?? undefined,
        };
      } catch (error) {
        console.log(`Erro ao verificar foto ${photo.id}:`, error);
        return {
          id: photo.id,
          uri: photo.uri,
          legenda: photo.legenda,
          data: photo.data,
          local: photo.local,
          latitude: photo.latitude ?? undefined,
          longitude: photo.longitude ?? undefined,
        };
      }
    }));
    
    console.log(`Retornando ${photos.length} fotos do cache`);
    return photos;
  } catch (error) {
    console.error('Erro ao obter fotos do cache:', error);
    return [];
  }
};

// Atualizar legenda no cache
export const updateCachedPhotoCaption = async (photoId: string, legenda: string) => {
  if (!db) await initPhotosCache();
  if (!db) return;
  
  try {
    await db.runAsync(
      'UPDATE photos_cache SET legenda = ? WHERE id = ?',
      [legenda, photoId]
    );
    console.log('Legenda atualizada no cache:', photoId);
  } catch (error) {
    console.error('Erro ao atualizar legenda no cache:', error);
  }
};

// Deletar foto do cache
export const deleteCachedPhoto = async (photoId: string) => {
  if (!db) await initPhotosCache();
  if (!db) return;
  
  try {
    // Obter caminho local antes de deletar
    const photo = await db.getFirstAsync<{ local_path: string }>(
      'SELECT local_path FROM photos_cache WHERE id = ?',
      [photoId]
    );
    
    if (photo && !photo.local_path.startsWith('http')) {
      // Deletar arquivo local
      try {
        await FileSystem.deleteAsync(photo.local_path, { idempotent: true });
      } catch (err) {
        console.log('Erro ao deletar arquivo local:', err);
      }
    }
    
    // Deletar do banco
    await db.runAsync('DELETE FROM photos_cache WHERE id = ?', [photoId]);
    console.log('Foto removida do cache:', photoId);
  } catch (error) {
    console.error('Erro ao deletar foto do cache:', error);
  }
};

// Limpar cache de um usuário
export const clearUserCache = async (userId: string) => {
  if (!db) await initPhotosCache();
  if (!db) return;
  
  try {
    // Obter todas as fotos do usuário
    const photos = await db.getAllAsync<{ local_path: string }>(
      'SELECT local_path FROM photos_cache WHERE user_id = ?',
      [userId]
    );
    
    // Deletar arquivos locais
    if (photos) {
      for (const photo of photos) {
        if (!photo.local_path.startsWith('http')) {
          try {
            await FileSystem.deleteAsync(photo.local_path, { idempotent: true });
          } catch (err) {
            console.log('Erro ao deletar arquivo:', err);
          }
        }
      }
    }
    
    // Deletar do banco
    await db.runAsync('DELETE FROM photos_cache WHERE user_id = ?', [userId]);
    console.log('Cache limpo para usuário:', userId);
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
};

// Verificar se há fotos em cache
export const hasCachedPhotos = async (userId: string): Promise<boolean> => {
  if (!db) await initPhotosCache();
  if (!db) return false;
  
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM photos_cache WHERE user_id = ?',
      [userId]
    );
    return (result?.count || 0) > 0;
  } catch (error) {
    console.error('Erro ao verificar cache:', error);
    return false;
  }
};
