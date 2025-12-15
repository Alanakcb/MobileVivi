import { supabase } from './supabaseClient';
import { saveSession, clearSession, getSession } from './sessionStorage';

export async function signUp(email: string, password: string) {
  const result = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: undefined,
      // Não requer confirmação de email
    }
  });
  
  // Salvar sessão no SQLite se o login foi bem-sucedido
  if (result.data.session && result.data.user) {
    await saveSession({
      access_token: result.data.session.access_token,
      refresh_token: result.data.session.refresh_token,
      user_id: result.data.user.id,
      user_email: result.data.user.email,
      expires_at: Math.floor(new Date(result.data.session.expires_at || 0).getTime() / 1000)
    });
  }
  
  return result;
}

export async function signIn(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({ email, password });
  
  // Salvar sessão no SQLite se o login foi bem-sucedido
  if (result.data.session && result.data.user) {
    await saveSession({
      access_token: result.data.session.access_token,
      refresh_token: result.data.session.refresh_token,
      user_id: result.data.user.id,
      user_email: result.data.user.email,
      expires_at: Math.floor(new Date(result.data.session.expires_at || 0).getTime() / 1000)
    });
  }
  
  return result;
}

export async function signOut() {
  // Limpar sessão do SQLite
  await clearSession();
  return await supabase.auth.signOut();
}

export async function getUser() {
  try {
    // Tentar obter do Supabase (online)
    const result = await supabase.auth.getUser();
    if (result.data.user) {
      return result;
    }
  } catch (error) {
    console.log('Sem conexão com Supabase, usando sessão local');
  }
  
  // Se falhar ou estiver offline, usar sessão local
  const session = await getSession();
  if (session && session.user_id) {
    return {
      data: {
        user: {
          id: session.user_id,
          email: session.user_email || '',
          created_at: '',
          updated_at: ''
        }
      },
      error: null
    };
  }
  
  return {
    data: { user: null },
    error: { message: 'Usuário não autenticado' }
  };
}

// Restaurar sessão do SQLite
export async function restoreSession() {
  const session = await getSession();
  
  if (session) {
    try {
      // Tentar restaurar sessão no Supabase (quando há internet)
      const { data, error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      
      if (error) {
        console.log('Sem internet ou sessão inválida no Supabase, usando sessão local');
        // Mesmo com erro, retornar a sessão local para funcionar offline
        return {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: { id: session.user_id }
        };
      }
      
      return data.session;
    } catch (error) {
      // Se não houver internet, usar a sessão local
      console.log('Modo offline detectado, usando sessão local');
      return {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: { id: session.user_id }
      };
    }
  }
  
  return null;
}

// Obter user ID da sessão local (para modo offline)
export async function getLocalUserId(): Promise<string | null> {
  const session = await getSession();
  return session ? session.user_id : null;
}
