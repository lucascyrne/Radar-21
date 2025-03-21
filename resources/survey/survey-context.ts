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
export interface SurveyState {
  profile: UserProfile | null;
  surveyResponses: SurveyResponses | null;
  openQuestions: OpenQuestionsFormValues | null;
  teamMemberId: string | null;
  isLoading: boolean;
  error: string | null;
  radarData: RadarDataPoint[];
}

export interface SurveyContextType extends SurveyState {
  questions: Question[];
  answers: SurveyResponses | null;
  saveAnswers: (responses: SurveyResponses) => Promise<boolean>;
  generateRadarData: () => Promise<void>;
  saveProfile: (data: ProfileFormValues) => Promise<boolean>;
  saveOpenQuestions: (data: OpenQuestionsFormValues) => Promise<boolean>;
  updateTeamMemberId: (teamMemberId: string | null) => void;
  completeAllSteps: () => Promise<boolean>;
}

const initialState: SurveyContextType = {
  // Estado inicial
  profile: null,
  surveyResponses: null,
  openQuestions: null,
  teamMemberId: null,
  isLoading: false,
  error: null,
  radarData: [],
  questions: [],
  answers: null,

  // Funções vazias (serão implementadas no provider)
  saveAnswers: async () => false,
  generateRadarData: async () => {},
  saveProfile: async () => false,
  saveOpenQuestions: async () => false,
  updateTeamMemberId: () => {},
  completeAllSteps: async () => false
};

const SurveyContext = createContext<SurveyContextType>(initialState);

export default SurveyContext; 