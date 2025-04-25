import { z } from "zod";

// Definir os status possíveis
export type TeamMemberStatus = "invited" | "pending_survey" | "answered";

// Esquema para criação de equipe
export const createTeamSchema = z.object({
  name: z.string().min(3, "O nome da equipe deve ter pelo menos 3 caracteres"),
  role: z.enum(["leader", "member"]),
  team_size: z.number().min(1, "A equipe deve ter pelo menos 1 membro"),
  organization_id: z.string().uuid().optional(),
});

export type CreateTeamFormValues = z.infer<typeof createTeamSchema>;

// Schema para entrar em uma equipe
export const joinTeamSchema = z.object({
  team_name: z
    .string()
    .min(3, "O nome da equipe deve ter pelo menos 3 caracteres"),
  owner_email: z.string().email("Por favor, forneça um email válido"),
});

export type JoinTeamFormValues = z.infer<typeof joinTeamSchema>;

// Schema para enviar convite por email
export const inviteEmailSchema = z.object({
  email: z.string().email("Por favor, forneça um email válido"),
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres"),
});

export type InviteEmailFormValues = z.infer<typeof inviteEmailSchema>;

// Tipos para o contexto de equipes
export interface Team {
  id: string;
  name: string;
  owner_email: string;
  team_size: number;
  organization_id?: string;
  created_at: string;
}

// Membro da equipe
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  email: string;
  role: "leader" | "member";
  status: TeamMemberStatus;
  created_at: string;
}

export interface TeamMembership {
  team_id: string;
  user_id: string;
  email: string;
  role: "leader" | "member";
  status: TeamMemberStatus;
}

// Interface para respostas da pesquisa por equipe
export interface TeamSurveyResponse {
  team_member_id: string;
  team_id: string;
  user_id: string;
  email: string;
  role: "leader" | "member";
  status: TeamMemberStatus;
  q1?: number;
  q2?: number;
  q3?: number;
  q4?: number;
  q5?: number;
  q6?: number;
  q7?: number;
  q8?: number;
  q9?: number;
  q10?: number;
  q11?: number;
  q12?: number;
  leadership_strengths?: string;
  leadership_improvements?: string;
  response_created_at?: string;
  response_updated_at?: string;
}

// Estado do contexto de equipes
export interface TeamState {
  teams: Team[];
  selectedTeam: Team | null;
  teamMembers: TeamMember[];
  currentMember: TeamMember | null;
  teamSurveyResponses: TeamSurveyResponse[];
  isLoading: boolean;
  error: string | null;
}

export interface TeamResponse {
  id: string;
  name: string;
  owner_email: string;
  team_size: number;
  created_at: string;
}

export interface MemberTeamResponse {
  team_id: string;
  teams: TeamResponse;
}
