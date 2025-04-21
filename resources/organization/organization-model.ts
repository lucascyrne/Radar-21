import { z } from "zod";
import { User } from "../auth/auth-model";

// Tipos para organizações
export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string | null;
  email: string;
  role: "admin" | "leader";
  status: "invited" | "active";
  last_reminder_sent: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface OrganizationTeam {
  id: string;
  organization_id: string;
  team_id: string;
  created_at: string;
  team_name?: string;
}

// Interface para visão geral das equipes da organização
export interface OrganizationTeamOverview {
  organization_id: string;
  organization_name: string;
  team_id: string;
  team_name: string;
  members_answered: number;
  total_members: number;
  team_created_at: string;
  leaders_answered: number;
  total_leaders: number;
  completion_percentage?: number;
}

// Interface para respostas abertas
export interface OrganizationOpenAnswer {
  organization_id: string;
  organization_name: string;
  team_id: string;
  team_name: string;
  user_id: string;
  email: string;
  role: string;
  leadership_strengths: string | null;
  leadership_improvements: string | null;
  response_date: string;
}

// Estado do contexto de organização
export interface OrganizationState {
  organizations: Organization[];
  selectedOrganization: Organization | null;
  organizationMembers: OrganizationMember[];
  teamOverviews: OrganizationTeamOverview[];
  openAnswers: OrganizationOpenAnswer[];
  isLoading: boolean;
  error: string | null;
}

// Esquemas de validação
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(3, "O nome da organização deve ter pelo menos 3 caracteres"),
});

export const inviteLeaderSchema = z.object({
  email: z.string().email("Por favor, forneça um email válido"),
  message: z.string().optional(),
});

export type CreateOrganizationFormValues = z.infer<
  typeof createOrganizationSchema
>;
export type InviteLeaderFormValues = z.infer<typeof inviteLeaderSchema>;
