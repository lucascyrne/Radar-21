'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { AuthContext, initialAuthState } from './auth-context';
import { AuthService } from './auth.service';
import { AuthState } from './auth-model';
import { useRouter } from 'next/navigation';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Função para atualizar o estado com base na sessão
  const updateStateWithSession = (session: Session | null) => {
    setAuthState({
      session,
      user: session?.user || null,
      isLoading: false,
      isAuthenticated: !!session,
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

  // Login com Google
  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await AuthService.signInWithGoogle();
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
