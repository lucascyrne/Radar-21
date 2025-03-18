import { z } from 'zod';
import { Session } from '@supabase/supabase-js';
import { SurveyResponses } from '../survey/survey-model';

// Tipos para autenticação e gerenciamento de usuários
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  team_id?: string;
  role?: UserRole;
  status?: UserStatus;
  last_form_page?: string; // Última página do formulário que o usuário visitou
  has_completed_form?: boolean; // Indica se o usuário completou o formulário
  raw_app_meta_data?: {
    is_temp?: boolean;
  };
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  aud?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest'
}

export enum UserStatus {
  INVITED = 'Convidado',
  RESPONDED = 'Respondido'
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  surveyResponses: SurveyResponses | null;
}

export interface InviteUserParams {
  email: string;
  teamId: string;
  message?: string; // Mensagem personalizada para o convite
}

export interface FormProgressState {
  currentPage: string;
  completedPages: string[];
  isComplete: boolean;
}

// Resposta da API para operações de autenticação
export interface AuthResponse {
  user: User | null;
  session: any | null;
  error?: string;
}

// Esquemas de validação Zod
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export const registerSchema = loginSchema.extend({
  confirmPassword: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
