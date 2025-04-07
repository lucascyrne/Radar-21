import { z } from 'zod';

// Esquema para os dados demográficos (primeiro passo)
export const demographicDataSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  birth_date: z.string().optional(),
  education: z.string().min(1, 'Selecione seu nível de escolaridade'),
  graduation_date: z.string().optional(),
  graduation_university: z.string().optional(),
  employee_count: z.number().min(0, 'Número de funcionários deve ser maior ou igual a 0'),
  organization: z.string().min(2, 'Nome da organização deve ter pelo menos 2 caracteres'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  org_type: z.string().min(1, 'Selecione o tipo de organização'),
  org_size: z.string().min(1, 'Selecione o porte da organização'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  work_model: z.string().min(1, 'Selecione o modelo de trabalho'),
});

export type DemographicFormValues = z.infer<typeof demographicDataSchema>;

// Esquema para as perguntas abertas
export const openQuestionsSchema = z.object({
  q13: z.string().min(1, 'Este campo é obrigatório'),
  q14: z.string().optional(),
});

export type OpenQuestionsFormValues = z.infer<typeof openQuestionsSchema>;

// Tipo para as respostas do questionário
export type SurveyResponses = {
  [key: string]: number;
};

export type SurveyFormValues = SurveyResponses;

// Tipo para uma questão do questionário
export interface Question {
  id: string;
  text: string;
  competency: string;
}

// Estado do questionário
export interface SurveyState {
  userId: string | null;
  teamId: string | null;
  demographicData: DemographicData | null;
  surveyResponses: SurveyResponses | null;
  openQuestions: OpenQuestionResponse | null;
  loading: {
    demographicData: boolean;
    survey: boolean;
    openQuestions: boolean;
    teamMember: boolean;
    saving: boolean;
  };
  error: {
    demographicData: string | null;
    survey: string | null;
    openQuestions: string | null;
  };
  radarData: RadarDataPoint[];
  questions: Question[];
  answers: SurveyResponses | null;
  isSaving: boolean;
}

// Interface para os dados demográficos
export interface DemographicData {
  id: string;
  user_id: string;
  team_id: string;
  name: string;
  birth_date?: string;
  education: string;
  graduation_university?: string;
  graduation_date?: string;
  employee_count: number;
  organization: string;
  website?: string;
  org_type: string;
  org_size: string;
  city: string;
  work_model: string;
  created_at: string;
  updated_at: string;
}

// Interface para as respostas do questionário no banco de dados
export interface SurveyResponse {
  id: string;
  user_id: string;
  team_id: string;
  created_at: string;
  updated_at: string;
  responses: SurveyResponses;
  is_complete: boolean;
}

// Interface para as respostas das perguntas abertas no banco de dados
export interface OpenQuestionResponse extends OpenQuestionsFormValues {
  id: string;
  user_id: string;
  team_id: string;
  created_at: string;
  updated_at: string;
}

export interface RadarDataPoint {
  category: string;
  value: number;
}

