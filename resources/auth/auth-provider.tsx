'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import AuthContext, { initialState } from './auth-context';
import { AuthService, supabase } from './auth.service';
import { AuthState, User } from './auth-model';
import { useRouter } from 'next/navigation';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Função para atualizar o estado com base na sessão
  const updateStateWithSession = (session: Session | null) => {
    setAuthState({
      session,
      // Convertendo o tipo User do Supabase para o nosso tipo User
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name,
        avatar_url: session.user.user_metadata?.avatar_url,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at,
        team_id: session.user.user_metadata?.team_id,
        role: session.user.user_metadata?.role,
        status: session.user.user_metadata?.status,
        last_form_page: session.user.user_metadata?.last_form_page,
        has_completed_form: session.user.user_metadata?.has_completed_form,
      } : null,
      isLoading: false,
      isAuthenticated: !!session,
      error: null,
    });
  };

  // Inicializar e verificar a sessão ao carregar
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // Verificar se há uma sessão ativa
        const session = await AuthService.getSession();
        
        if (isMounted) {
          updateStateWithSession(session);
        }
        
        // Configurar listener para mudanças na autenticação
        const { data: { subscription } } = AuthService.onAuthStateChange((event, session) => {
          if (!isMounted) return;
          
          console.log('Auth state changed:', event, session?.user?.email);
          updateStateWithSession(session);
          
          // Redirecionar após login bem-sucedido
          if (event === 'SIGNED_IN' && window.location.pathname.includes('/auth')) {
            router.push('/team-setup');
          }
          
          // Redirecionar após logout
          if (event === 'SIGNED_OUT') {
            router.push('/auth');
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        if (isMounted) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Efeito para mover dados de convite antigos para novas chaves e limpar
  useEffect(() => {
    // Migrar chaves antigas para o novo formato
    const oldPendingInvite = localStorage.getItem('pendingInvite');
    const oldPendingInviteEmail = localStorage.getItem('pendingInviteEmail');
    
    if (oldPendingInvite) {
      localStorage.setItem('pendingInviteTeamId', oldPendingInvite);
      localStorage.removeItem('pendingInvite');
    }
    
    if (oldPendingInviteEmail) {
      localStorage.setItem('pendingInviteEmail', oldPendingInviteEmail);
      localStorage.removeItem('pendingInviteEmail');
    }
  }, []);

  // Login com Google atualizado
  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Capturar os dados do convite pendente antes de redirecionar
      const pendingInviteTeamId = localStorage.getItem('pendingInviteTeamId');
      const pendingInviteTeamName = localStorage.getItem('pendingInviteTeamName');
      
      // Determinar a URL base para redirecionamento
      const baseRedirectUrl = `${window.location.origin}/auth/callback`;
      
      // Se houver um convite pendente, adicionar como state parameter no URL
      let redirectUrl = baseRedirectUrl;
      if (pendingInviteTeamId) {
        redirectUrl = `${baseRedirectUrl}?invite=${pendingInviteTeamId}`;
        if (pendingInviteTeamName) {
          redirectUrl += `&invite_name=${encodeURIComponent(pendingInviteTeamName)}`;
        }
      }
      
      console.log('Iniciando login Google com redirecionamento para:', redirectUrl);
      
      // Agora passamos as opções corretamente com a URL de redirecionamento
      await AuthService.signInWithGoogle({
        redirectTo: redirectUrl
      });
    } catch (error: any) {
      console.error('Erro ao fazer login com Google:', error);
      setError(error.message || 'Erro ao fazer login com Google');
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Login com Email/Senha
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await AuthService.signInWithEmail(email, password);
    } catch (error: any) {
      console.error('Erro ao fazer login com email:', error);
      setError(error.message || 'Credenciais inválidas');
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Registro com Email/Senha
  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const { user } = await AuthService.signUpWithEmail(email, password);
      
      if (user) {
        // Se o usuário foi criado com sucesso
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error: any) {
      console.error('Erro ao registrar com email:', error);
      setError(error.message || 'Erro ao criar conta');
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await AuthService.signOut();
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      router.push('/auth');
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Limpar mensagens de erro
  const clearError = () => setError(null);

  // Implementação das funções adicionais definidas na interface AuthContextType
  const inviteUser = async (params: { email: string; teamId: string; message?: string }) => {
    try {
      const inviteUrl = `${window.location.origin}/auth/accept-invite?team=${params.teamId}`;
      
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: params.email,
          inviteUrl,
          message: params.message,
          teamId: params.teamId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar convite');
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      return { success: false, error: error.message };
    }
  };

  const updateFormProgress = async (page: string, isComplete = false) => {
    try {
      if (!authState.user) {
        return { success: false, error: 'Usuário não autenticado' };
      }
      
      const { error } = await supabase
        .from('users')
        .update({
          last_form_page: page,
          has_completed_form: isComplete,
        })
        .eq('id', authState.user.id);
      
      if (error) throw error;
      
      // Atualizar o estado local
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          last_form_page: page,
          has_completed_form: isComplete,
        } : null,
      }));
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar progresso do formulário:', error);
      return { success: false, error: error.message };
    }
  };

  const getNextFormPage = () => {
    // Lógica para determinar a próxima página com base no progresso do usuário
    if (!authState.user?.last_form_page) {
      return '/form/step1'; // Página inicial do formulário
    }
    
    // Mapeamento de páginas do formulário
    const formPages = [
      '/form/step1',
      '/form/step2',
      '/form/step3',
      '/form/step4',
      '/form/step5',
      '/resultados',
    ];
    
    const currentIndex = formPages.indexOf(authState.user.last_form_page);
    
    if (currentIndex === -1 || currentIndex === formPages.length - 1) {
      return '/form/step1'; // Voltar ao início se não encontrar ou estiver na última página
    }
    
    return formPages[currentIndex + 1];
  };

  const hasCompletedForm = () => {
    return !!authState.user?.has_completed_form;
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        error,
        clearError,
        inviteUser,
        updateFormProgress,
        getNextFormPage,
        hasCompletedForm,
        setUser: (user) => setAuthState(prev => ({ ...prev, user })),
        setSession: (session) => setAuthState(prev => ({ ...prev, session })),
        setIsLoading: (isLoading) => setAuthState(prev => ({ ...prev, isLoading })),
        setIsAuthenticated: (isAuthenticated) => setAuthState(prev => ({ ...prev, isAuthenticated })),
        setError: (error) => setError(error),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
