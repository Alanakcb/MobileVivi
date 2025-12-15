import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

// Inicializar o banco de dados
export const initSessionDB = async () => {
  try {
    db = await SQLite.openDatabaseAsync('session.db');
    
    // Criar tabela de sessão se não existir
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS session (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_token TEXT,
        refresh_token TEXT,
        user_id TEXT,
        user_email TEXT,
        expires_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
    
    // Adicionar coluna user_email se não existir (para bancos existentes)
    try {
      await db.execAsync(`
        ALTER TABLE session ADD COLUMN user_email TEXT;
      `);
      console.log('Coluna user_email adicionada');
    } catch (alterError: any) {
      // Ignorar erro se a coluna já existir
      if (!alterError.message?.includes('duplicate column name')) {
        console.log('Coluna user_email já existe ou erro ao adicionar:', alterError.message);
      }
    }
    
    console.log('Banco de dados de sessão inicializado');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados de sessão:', error);
  }
};

// Salvar sessão
export const saveSession = async (session: {
  access_token: string;
  refresh_token: string;
  user_id: string;
  user_email?: string;
  expires_at: number;
}) => {
  if (!db) await initSessionDB();
  
  try {
    // Limpar sessões antigas
    await db?.runAsync('DELETE FROM session');
    
    // Inserir nova sessão
    await db?.runAsync(
      'INSERT INTO session (access_token, refresh_token, user_id, user_email, expires_at) VALUES (?, ?, ?, ?, ?)',
      [session.access_token, session.refresh_token, session.user_id, session.user_email || '', session.expires_at]
    );
    
    console.log('Sessão salva com sucesso');
  } catch (error) {
    console.error('Erro ao salvar sessão:', error);
  }
};

// Recuperar sessão
export const getSession = async (): Promise<{
  access_token: string;
  refresh_token: string;
  user_id: string;
  user_email?: string;
  expires_at: number;
} | null> => {
  if (!db) await initSessionDB();
  
  try {
    const result = await db?.getFirstAsync<{
      access_token: string;
      refresh_token: string;
      user_id: string;
      user_email?: string;
      expires_at: number;
    }>('SELECT access_token, refresh_token, user_id, user_email, expires_at FROM session ORDER BY created_at DESC LIMIT 1');
    
    if (result) {
      // Não verificar expiração para funcionar offline
      // A sessão será válida localmente até o logout manual
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao recuperar sessão:', error);
    return null;
  }
};

// Limpar sessão
export const clearSession = async () => {
  if (!db) await initSessionDB();
  
  try {
    await db?.runAsync('DELETE FROM session');
    console.log('Sessão limpa com sucesso');
  } catch (error) {
    console.error('Erro ao limpar sessão:', error);
  }
};

// Verificar se há sessão ativa
export const hasActiveSession = async (): Promise<boolean> => {
  const session = await getSession();
  return session !== null;
};
