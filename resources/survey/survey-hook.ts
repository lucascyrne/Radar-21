"use client"

import { useContext } from 'react';
import { SurveyContext } from './survey-context';
import { OpenQuestionsFormValues, ProfileFormValues, SurveyResponses } from './survey-model';

export function useSurvey() {
  const context = useContext(SurveyContext);

  if (!context) {
    throw new Error('useSurvey deve ser usado dentro de um SurveyProvider');
  }

  return {
    // Estado
    profile: context.state.profile,
    teamMemberId: context.state.teamMemberId,
    surveyResponses: context.state.surveyResponses,
    openQuestionResponses: context.state.openQuestionResponses,
    loading: context.state.isLoading,
    error: context.state.error,
    
    // Métodos para perfil
    loadProfile: context.loadProfile,
    saveProfile: context.saveProfile,
    
    // Métodos para respostas da pesquisa
    loadSurveyResponses: context.loadSurveyResponses,
    saveSurveyResponses: context.saveSurveyResponses,
    
    // Métodos para questões abertas
    loadOpenQuestionResponses: context.loadOpenQuestionResponses,
    saveOpenQuestionResponses: context.saveOpenQuestionResponses,
    
    // Métodos para verificação de conclusão
    completeAllSteps: context.completeAllSteps,
    
    // Métodos para gerenciamento de carregamento
    updateLoading: context.updateLoading,
    
    // Métodos para gerenciamento de ID do membro da equipe
    fetchTeamMemberId: context.fetchTeamMemberId,
    updateTeamMemberId: context.updateTeamMemberId
  };
} 