"use client"

import { useContext } from 'react';
import { SurveyContext } from './survey-context';
import { SurveyContextType } from './survey-context';

export function useSurvey(): SurveyContextType {
  const context = useContext(SurveyContext);

  if (!context) {
    throw new Error('useSurvey deve ser usado dentro de um SurveyProvider');
  }

  return context;
} 