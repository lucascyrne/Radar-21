import { createContext, useContext } from 'react';
import { AuthContextType, AuthState } from './auth-model';

// Estado inicial de autenticação
export const initialAuthState: AuthState = {
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

// Criação do contexto de autenticação
export const AuthContext = createContext<AuthContextType>({
  ...initialAuthState,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  error: null,
  clearError: () => {},
});

// Hook para usar o contexto de autenticação
export const useAuth = () => useContext(AuthContext);
