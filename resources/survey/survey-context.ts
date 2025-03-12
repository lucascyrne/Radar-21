"use client"

import { createContext } from 'react';
import { 
  OpenQuestionResponses, 
  ProfileFormValues,
  SurveyResponses,
  SurveyState,
  OpenQuestionsFormValues,
  UserProfile,
  SurveyFormValues
} from './survey-model';

// Estado inicial do contexto de pesquisa
export const initialSurveyState: SurveyState = {
  teamMemberId: null,
  profile: null,
  surveyResponses: null,
  openQuestionResponses: null,
  isLoading: false,
  error: null,
};

// Tipo do contexto de pesquisa
export interface SurveyContextType {
  state: SurveyState;
  
  // Funções para perfil
  loadProfile: () => Promise<UserProfile | null>;
  saveProfile: (profile: ProfileFormValues) => Promise<UserProfile | null>;
  
  // Funções para respostas do questionário
  loadSurveyResponses: () => Promise<SurveyResponses | null>;
  saveSurveyResponses: (data: SurveyFormValues) => Promise<SurveyResponses | null>;
  
  // Funções para perguntas abertas
  loadOpenQuestionResponses: () => Promise<OpenQuestionResponses | null>;
  saveOpenQuestionResponses: (data: OpenQuestionResponses) => Promise<OpenQuestionResponses | null>;
  saveOpenQuestions?: (data: OpenQuestionsFormValues) => Promise<OpenQuestionResponses | null>;
  
  // Função para marcar todas as etapas como concluídas
  completeAllSteps: () => Promise<boolean>;
  
  // Métodos para gerenciamento de carregamento
  updateLoading: (loading: boolean, error?: string | null) => void;
  
  // Métodos para gerenciamento de ID do membro da equipe
  fetchTeamMemberId: () => Promise<string | null>;
  updateTeamMemberId: (id: string | null) => void;
}

// Criar o contexto com valor inicial null
export const SurveyContext = createContext<SurveyContextType | null>(null); 