import { createContext, useContext } from 'react';
import { AuthState, InviteUserParams, User } from './auth-model';

interface AuthContextType extends AuthState {
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setError: (error: string | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  inviteUser: (params: InviteUserParams) => Promise<{ success: boolean; userId?: string; error?: string }>;
  updateFormProgress: (page: string, isComplete?: boolean) => Promise<{ success: boolean; error?: string }>;
  getNextFormPage: () => string;
  hasCompletedForm: () => boolean;
}

export const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Criando o contexto com valores padrão
const AuthContext = createContext<AuthContextType>({
  ...initialState,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  clearError: () => {},
  inviteUser: async () => ({ success: false, error: 'Não implementado' }),
  updateFormProgress: async () => ({ success: false, error: 'Não implementado' }),
  getNextFormPage: () => '/login',
  hasCompletedForm: () => false,
  setUser: () => {},
  setSession: () => {},
  setIsLoading: () => {},
  setIsAuthenticated: () => {},
  setError: () => {},
});

export default AuthContext;