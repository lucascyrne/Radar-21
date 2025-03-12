import { z } from 'zod';
import { TeamMemberStatus } from '../survey/survey-model';

// Esquema para criação de equipe
export const createTeamSchema = z.object({
  name: z.string().min(3, 'O nome da equipe deve ter pelo menos 3 caracteres'),
  role: z.enum(['leader', 'member']),
  team_size: z.number().min(1, 'A equipe deve ter pelo menos 1 membro'),
});

export type CreateTeamFormValues = z.infer<typeof createTeamSchema>;

// Schema para entrar em uma equipe
export const joinTeamSchema = z.object({
  team_name: z.string().min(3, 'O nome da equipe deve ter pelo menos 3 caracteres'),
  owner_email: z.string().email('Por favor, forneça um email válido'),
});

export type JoinTeamFormValues = z.infer<typeof joinTeamSchema>;

// Schema para enviar convite por email
export const inviteEmailSchema = z.object({
  email: z.string().email('Por favor, forneça um email válido'),
  message: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres'),
});

export type InviteEmailFormValues = z.infer<typeof inviteEmailSchema>;

// Tipos para o contexto de equipes
export interface Team {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string;
  team_size: number;
  created_at: string;
}

// Membro da equipe
export interface TeamMember {
  id?: string;
  team_id?: string;
  user_id?: string;
  email?: string;
  role?: 'leader' | 'member';
  status?: TeamMemberStatus;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMembership {
  team_id: string;
  user_id: string;
  email: string;
  role: 'leader' | 'member';
  status: 'invited' | 'registered' | 'respondido';
}

// Estado do contexto de equipes
export interface TeamState {
  teams: Team[];
  selectedTeam: Team | null;
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: string | null;
}