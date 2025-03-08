import { z } from 'zod';

export interface Team {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
  owner_email: string;
  team_size: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  email: string;
  role: 'leader' | 'member';
  status: 'invited' | 'registered' | 'completed';
  created_at: string;
}

// Esquemas de validação Zod
export const createTeamSchema = z.object({
  name: z.string().min(3, 'O nome da equipe deve ter pelo menos 3 caracteres'),
  role: z.enum(['leader', 'member'], {
    errorMap: () => ({ message: 'Selecione um papel válido' }),
  }),
  team_size: z.number().min(1, 'A equipe deve ter pelo menos 1 pessoa'),
});

export const joinTeamSchema = z.object({
  team_name: z.string().min(3, 'O nome da equipe deve ter pelo menos 3 caracteres'),
  owner_email: z.string().email('Email inválido'),
});

export type CreateTeamFormValues = z.infer<typeof createTeamSchema>;
export type JoinTeamFormValues = z.infer<typeof joinTeamSchema>; 