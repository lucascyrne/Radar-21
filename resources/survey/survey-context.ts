"use client";

import { createContext } from "react";
import {
  CompetencyComparison,
  DemographicData,
  DemographicFormValues,
  OpenQuestionResponse,
  OpenQuestionsFormValues,
  Question,
  RadarDataPoint,
  SurveyResponses,
} from "./survey-model";

// Tipo do contexto de pesquisa
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
  competencyComparison: CompetencyComparison[];
}

export interface SurveyContextType extends SurveyState {
  saveAnswers: (responses: SurveyResponses) => Promise<boolean>;
  generateRadarData: () => Promise<void>;
  saveDemographicData: (data: DemographicFormValues) => Promise<boolean>;
  saveSurveyResponses: (responses: SurveyResponses) => Promise<boolean>;
  saveOpenQuestions: (data: OpenQuestionsFormValues) => Promise<boolean>;
  updateUserId: (userId: string | null) => void;
  updateTeamId: (teamId: string | null) => void;
  loadData: () => Promise<void>;
  completeAllSteps: () => Promise<boolean>;
  getCompetencyComparison: (teamId: string) => Promise<CompetencyComparison[]>;
}

export const initialState: SurveyState = {
  userId: null,
  teamId: null,
  demographicData: null,
  surveyResponses: null,
  openQuestions: null,
  loading: {
    demographicData: false,
    survey: false,
    openQuestions: false,
    teamMember: false,
    saving: false,
  },
  error: {
    demographicData: null,
    survey: null,
    openQuestions: null,
  },
  radarData: [],
  questions: [],
  answers: null,
  isSaving: false,
  competencyComparison: [],
};

const SurveyContext = createContext<SurveyContextType>(
  initialState as SurveyContextType
);

export default SurveyContext;
