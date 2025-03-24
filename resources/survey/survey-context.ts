"use client"

import { createContext } from 'react';
import { 
  ProfileFormValues,
  SurveyResponses,
  OpenQuestionsFormValues,
  UserProfile,
  Question,
  RadarDataPoint,
  OpenQuestionResponse,
} from './survey-model';

// Tipo do contexto de pesquisa
export interface SurveyState {
  userId: string | null;
  teamId: string | null;
  profile: UserProfile | null;
  surveyResponses: SurveyResponses | null;
  openQuestions: OpenQuestionResponse | null;
  loading: {
    profile: boolean;
    survey: boolean;
    openQuestions: boolean;
    teamMember: boolean;
    saving: boolean;
  };
  error: {
    profile: string | null;
    survey: string | null;
    openQuestions: string | null;
  };
  radarData: RadarDataPoint[];
  questions: Question[];
  answers: SurveyResponses | null;
  isSaving: boolean;
}

export interface SurveyContextType extends SurveyState {
  saveAnswers: (responses: SurveyResponses) => Promise<boolean>;
  generateRadarData: () => Promise<void>;
  saveProfile: (data: ProfileFormValues) => Promise<boolean>;
  saveSurveyResponses: (responses: SurveyResponses) => Promise<boolean>;
  saveOpenQuestions: (data: OpenQuestionsFormValues) => Promise<boolean>;
  updateUserId: (userId: string | null) => void;
  updateTeamId: (teamId: string | null) => void;
  loadData: () => Promise<void>;
  completeAllSteps: () => Promise<boolean>;
}

export const initialState: SurveyState = {
  userId: null,
  teamId: null,
  profile: null,
  surveyResponses: null,
  openQuestions: null,
  loading: {
    profile: false,
    survey: false,
    openQuestions: false,
    teamMember: false,
    saving: false
  },
  error: {
    profile: null,
    survey: null,
    openQuestions: null
  },
  radarData: [],
  questions: [],
  answers: null,
  isSaving: false,
  
};

const SurveyContext = createContext<SurveyContextType>(initialState as SurveyContextType);

export default SurveyContext; 