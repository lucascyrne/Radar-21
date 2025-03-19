import { z } from 'zod';

// Esquema para o perfil do usuário
export const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  birth_date: z.string().optional(),
  education: z.string().min(1, 'Selecione seu nível de escolaridade'),
  graduation_date: z.string().optional(),
  graduation_course: z.string().optional(),
  graduation_institution: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  employee_count: z.number().min(0, 'Número de funcionários deve ser maior ou igual a 0'),
  industry: z.string().optional(),
  organization: z.string().min(2, 'Nome da organização deve ter pelo menos 2 caracteres'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  org_type: z.string().min(1, 'Selecione o tipo de organização'),
  org_size: z.string().min(1, 'Selecione o porte da organização'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  work_model: z.string().min(1, 'Selecione o modelo de trabalho'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// Esquema para as perguntas abertas
export const openQuestionsSchema = z.object({
  q13: z.string().min(1, 'Este campo é obrigatório'),
  q14: z.string().min(1, 'Este campo é obrigatório'),
});

export type OpenQuestionsFormValues = z.infer<typeof openQuestionsSchema>;

// Tipo para as respostas do questionário
export type SurveyResponses = Record<string, number>;

export type SurveyFormValues = SurveyResponses;

// Tipo para uma questão do questionário
export interface Question {
  id: string;
  text: string;
  competency: string;
}

// Estado do questionário
export interface SurveyState {
  profile: UserProfile | null;
  surveyResponses: SurveyResponses | null;
  openQuestions: OpenQuestionsFormValues | null;
  teamMemberId: string | null;
  isLoading: boolean;
  error: string | null;
  radarData: RadarDataPoint[];
}

// Tipo para o status do membro da equipe
export type TeamMemberStatus = 'invited' | 'answered';

// Interface para o perfil do usuário
export interface UserProfile extends ProfileFormValues {
  id: string;
  team_member_id: string;
  created_at: string;
  updated_at: string;
}

// Interface para as respostas do questionário no banco de dados
export interface SurveyResponse {
  id: string;
  team_member_id: string;
  created_at: string;
  updated_at: string;
  responses: SurveyResponses;
}

// Interface para as respostas das perguntas abertas no banco de dados
export interface OpenQuestionResponse extends OpenQuestionsFormValues {
  id: string;
  team_member_id: string;
  created_at: string;
  updated_at: string;
}

export interface RadarDataPoint {
  category: string;
  value: number;
}

export interface RadarDataPoint {
  category: string
  value: number
}
