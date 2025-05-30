import { Session } from "@supabase/supabase-js";
import { createContext } from "react";
import { SurveyResponses } from "../survey/survey-model";
import {
  AuthResponse,
  AuthState,
  InviteUserParams,
  UpdateProfileParams,
  User,
} from "./auth-model";

export const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  surveyResponses: null,
};

export interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<Session>;
  signUpWithEmail: (
    email: string,
    password: string,
    role: string
  ) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  clearError: () => void;
  inviteUser: (
    params: InviteUserParams
  ) => Promise<{ success: boolean; error?: string }>;
  updateFormProgress: (
    page: string,
    isComplete?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  getNextFormPage: () => string;
  hasCompletedForm: () => boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setError: (error: string | null) => void;
  setSurveyResponses: (surveyResponses: SurveyResponses | null) => void;
  updateProfile: (params: UpdateProfileParams) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  ...initialState,
  signInWithGoogle: async () => {},
  signInWithEmail: async (email: string, password: string) => {
    throw new Error("AuthProvider não inicializado");
  },
  signUpWithEmail: async () => {
    throw new Error("AuthProvider não inicializado");
  },
  signOut: async () => {},
  clearError: () => {},
  inviteUser: async () => ({ success: false }),
  updateFormProgress: async () => ({ success: false }),
  getNextFormPage: () => "/form/step1",
  hasCompletedForm: () => false,
  setUser: () => {},
  setSession: () => {},
  setIsLoading: () => {},
  setIsAuthenticated: () => {},
  setError: () => {},
  setSurveyResponses: () => {},
  updateProfile: async () => {},
  isLoading: false,
  isAuthenticated: false,
  error: null,
});

export default AuthContext;
