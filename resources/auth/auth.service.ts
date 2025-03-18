import { createClient, User } from '@supabase/supabase-js';
import { InviteService } from '@/resources/invite/invite.service';

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Serviço de autenticação
export const AuthService = {
  // Login com Google
  signInWithGoogle: async (options: { 
    redirectTo?: string; 
    queryParams?: { [key: string]: string } 
  } = {}) => {
    try {
      // Determinar a URL base com base no ambiente atual
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://radar21.com.br';
      
      // Construir a URL de redirecionamento completa
      const redirectUrl = options.redirectTo || `${baseUrl}/auth/callback`;
      
      console.log('Iniciando fluxo OAuth com redirect para:', redirectUrl);
      
      // Iniciar o fluxo de autenticação com a URL de redirecionamento correta
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Incluímos queryParams se forem fornecidos
          queryParams: options.queryParams
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      throw error;
    }
  },
  
  // Verificar sessão atual
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }
  },
  
  // Obter usuário atual
  getUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
  },
  
  // Logout
  signOut: async () => {
    try {
      // Chamar o método de logout do Supabase
      await supabase.auth.signOut();
      return true;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, consideramos o logout bem-sucedido
      return true;
    }
  },
  
  // Ouvir mudanças na autenticação
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Login com Email/Senha
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Registrar com Email/Senha
  signUpWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Verifica e processa automaticamente convites pendentes para o usuário autenticado
   * @param user Usuário autenticado
   */
  processAuthenticatedUser: async (user: User): Promise<void> => {
    if (!user.email) return;
    await InviteService.processInvite(user.id, user.email);
  }
};
