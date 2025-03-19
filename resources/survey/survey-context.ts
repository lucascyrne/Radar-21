"use client"

import { createContext } from 'react';
import { 
  ProfileFormValues,
  SurveyResponses,
  OpenQuestionsFormValues,
  UserProfile,
  Question,
  RadarDataPoint
} from './survey-model';

// Tipo do contexto de pesquisa
export interface SurveyContextType {
  // Estado
  profile: UserProfile | null;
  surveyResponses: SurveyResponses | null;
  openQuestions: OpenQuestionsFormValues | null;
  isLoading: boolean;
  error: string | null;
  teamMemberId: string | null;
  answers: SurveyResponses | null;

  // Dados da pesquisa
  questions: Question[];
  radarData: RadarDataPoint[] | null;

  // Ações
  saveAnswers: (answers: SurveyResponses) => Promise<boolean>;
  saveOpenQuestions: (data: OpenQuestionsFormValues) => Promise<boolean>;
  saveProfile: (data: ProfileFormValues) => Promise<boolean>;
  generateRadarData: () => Promise<void>;
  updateTeamMemberId: (id: string) => void;
  completeAllSteps: () => Promise<boolean>;
}

const initialState: SurveyContextType = {
  // Estado inicial
  profile: null,
  surveyResponses: null,
  openQuestions: null,
  isLoading: false,
  error: null,
  teamMemberId: null,
  answers: null,

  // Dados iniciais da pesquisa
  questions: [],
  radarData: null,

  // Funções vazias (serão implementadas no provider)
  saveAnswers: async () => false,
  saveOpenQuestions: async () => false,
  saveProfile: async () => false,
  generateRadarData: async () => {},
  updateTeamMemberId: () => {},
  completeAllSteps: async () => false
};

const SurveyContext = createContext<SurveyContextType>(initialState);

export default SurveyContext; 