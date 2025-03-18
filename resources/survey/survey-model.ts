import { z } from 'zod';

// Schema para validação do perfil
export const profileSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  birth_date: z.string().optional(),
  education: z.string().min(1, { message: "Selecione seu nível de escolaridade" }),
  graduation_date: z.string().optional(),
  organization: z.string().min(1, { message: "Nome da organização é obrigatório" }),
  website: z.string().optional(),
  org_type: z.string().min(1, { message: "Selecione o tipo de organização" }),
  org_size: z.string().min(1, { message: "Selecione o porte da organização" }),
  employee_count: z.coerce.number().min(0),
  city: z.string().optional(),
  work_model: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// Tipo para o status do membro da equipe
export type TeamMemberStatus = 
  | 'invited'
  | 'answered';
  
// Tipo para as respostas da pesquisa (genérico)
export interface SurveyResponses {
  [key: string]: string | number | null | undefined;
  team_member_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Schema para validação das respostas do questionário (valores numéricos)
export const surveyResponsesSchema = z.object({
  q1: z.number().min(1).max(5),
  q2: z.number().min(1).max(5),
  q3: z.number().min(1).max(5),
  q4: z.number().min(1).max(5),
  q5: z.number().min(1).max(5),
  q6: z.number().min(1).max(5),
  q7: z.number().min(1).max(5),
  q8: z.number().min(1).max(5),
  q9: z.number().min(1).max(5),
  q10: z.number().min(1).max(5),
  q11: z.number().min(1).max(5),
  q12: z.number().min(1).max(5),
});

// Schema para validação do formulário de pesquisa (valores em string)
export const surveySchema = z.object({
  q1: z.string().min(1, { message: "Por favor, selecione uma opção" }),
  q2: z.string().min(1, { message: "Por favor, selecione uma opção" }),
  q3: z.string().min(1, { message: "Por favor, selecione uma opção" }),
  q4: z.string().min(1, { message: "Por favor, selecione uma opção" }),
  q5: z.string().min(1, { message: "Por favor, selecione uma opção" }),
  q6: z.string().min(1, { message: "Por favor, selecione uma opção" }),
  q7: z.string().min(1, { message: "Por favor, selecione uma opção" }),
  q8: z.string().min(1, { message: "Por favor, selecione uma opção" }),
  q9: z.string().min(1, { message: "Por favor, selecione uma opção" }),
  q10: z.string().min(1, { message: "Por favor, selecione uma opção" }),
  q11: z.string().min(1, { message: "Por favor, selecione uma opção" }),
  q12: z.string().min(1, { message: "Por favor, selecione uma opção" }),
});

export type SurveyFormValues = z.infer<typeof surveySchema>;
export type SurveyResponseValues = z.infer<typeof surveyResponsesSchema>;

// Schema para validação das respostas das perguntas abertas
export const openQuestionResponsesSchema = z.object({
  q13: z.string().min(10, 'A resposta deve ter pelo menos 10 caracteres'),
  q14: z.string().min(10, 'A resposta deve ter pelo menos 10 caracteres'),
});

// Alias para compatibilidade com a página de perguntas abertas
export const openQuestionsSchema = openQuestionResponsesSchema;
export type OpenQuestionsFormValues = z.infer<typeof openQuestionsSchema>;

export type OpenQuestionResponses = z.infer<typeof openQuestionResponsesSchema>;

// Interface para o perfil do usuário
export interface UserProfile {
  id: string;
  team_member_id: string;
  name: string;
  birth_date: string | null;
  education: string;
  graduation_date: string | null;
  organization: string;
  website: string | null;
  org_type: string;
  org_size: string;
  employee_count: number;
  city: string | null;
  work_model: string | null;
  created_at: string;
  updated_at: string;
}

// Interface para as respostas do questionário no banco de dados
export interface SurveyResponse extends SurveyResponseValues {
  id: string;
  team_member_id: string;
  created_at: string;
  updated_at: string;
}

// Interface para as respostas das perguntas abertas no banco de dados
export interface OpenQuestionResponse extends OpenQuestionResponses {
  id: string;
  team_member_id: string;
  created_at: string;
  updated_at: string;
}

// Estado do contexto de pesquisa
export interface SurveyState {
  teamMemberId: string | null;
  profile: UserProfile | null;
  surveyResponses: SurveyResponses | null;
  openQuestionResponses: OpenQuestionResponses | null;
  isLoading: boolean;
  error: string | null;
}

export interface CompetencyDetail {
  topic: string;
  userScore: number;
  teamAverage: number;
  difference: number;
}
