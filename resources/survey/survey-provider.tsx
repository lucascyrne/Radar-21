'use client';

import { ReactNode, useCallback, useEffect, useState, useMemo } from 'react';
import SurveyContext from './survey-context';
import { SurveyService } from './survey.service';
import { 
  ProfileFormValues,
  OpenQuestionsFormValues,
  SurveyState,
  Question,
  SurveyFormValues,
  RadarDataPoint,
  SurveyResponses,
  UserProfile,
  OpenQuestionResponse
} from './survey-model';
import { useAuth } from '@/resources/auth/auth-hook';
import { useTeam } from '@/resources/team/team-hook';
import { supabase } from '../auth/auth.service';

interface SurveyProviderProps {
  children: ReactNode;
}

interface LoadingState {
  profile: boolean;
  survey: boolean;
  openQuestions: boolean;
  teamMember: boolean;
  saving: boolean;
}

const initialState: SurveyState = {
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
  isSaving: false
};

export const SurveyProvider: React.FC<SurveyProviderProps> = ({ children }) => {
  const [state, setState] = useState<SurveyState>(initialState);
  const { user } = useAuth();
  const { selectedTeam, teamMembers, loadTeamMembers } = useTeam();
  
  // Estados adicionais para pesquisa
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);

  // Métodos centralizados para atualização de estado
  const updateError = useCallback((type: keyof SurveyState['error'], message: string | null) => {
    setState(prev => ({
      ...prev,
      error: { ...prev.error, [type]: message }
    }));
  }, []);

  const updateLoading = useCallback((type: keyof SurveyState['loading'], isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [type]: isLoading }
    }));
  }, []);

  // Função para atualizar o ID do usuário
  const updateUserId = useCallback((userId: string | null) => {
    setState(prev => ({ ...prev, userId }));
  }, []);

  // Função para atualizar o ID da equipe
  const updateTeamId = useCallback((teamId: string | null) => {
    setState(prev => ({ ...prev, teamId }));
  }, []);

  // Buscar IDs do usuário e equipe
  const fetchTeamMemberId = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error("Email do usuário não encontrado");
      }

      let { data: teamMembers } = await supabase
        .from('team_members')
        .select('user_id, team_id')
        .eq('email', user.email)
        .single();

      if (!teamMembers) {
        throw new Error("Membro da equipe não encontrado");
      }

      const userId = teamMembers.user_id;
      const teamId = teamMembers.team_id;

      if (userId && teamId) {
        updateUserId(userId);
        updateTeamId(teamId);
        return { userId, teamId };
      }

      return null;
    } catch (error: any) {
      console.error('Erro ao buscar IDs:', error);
      return null;
    }
  }, []);

  // Carregar dados do perfil do usuário
  const loadProfile = useCallback(async () => {
    try {
      updateLoading('profile', true);
      
      if (!state.userId || !state.teamId) {
        const ids = await fetchTeamMemberId();
        if (!ids) {
          throw new Error("IDs do usuário e equipe não encontrados");
        }
        updateUserId(ids.userId);
        updateTeamId(ids.teamId);
      }
      
      if (!state.userId || !state.teamId) {
        throw new Error("IDs do usuário e equipe não encontrados");
      }
      
      const profile = await SurveyService.loadProfile(state.userId, state.teamId);
      setState(prev => ({ ...prev, profile }));
      return profile;
    } catch (error: any) {
      updateError('profile', error.message || 'Erro ao carregar perfil');
      return null;
    } finally {
      updateLoading('profile', false);
    }
  }, [state.userId, state.teamId]);

  // Salvar perfil do usuário
  const saveProfile = useCallback(async (data: ProfileFormValues): Promise<boolean> => {
    try {
      updateLoading('saving', true);
      
      if (!state.userId || !state.teamId) {
        throw new Error('ID do usuário ou equipe não encontrado');
      }
      
      await SurveyService.saveProfile(state.userId, state.teamId, data);
      const savedProfile = await SurveyService.loadProfile(state.userId, state.teamId);
      
      setState(prev => ({ 
        ...prev, 
        profile: savedProfile,
        error: { ...prev.error, profile: null }
      }));
      
      return true;
    } catch (error: any) {
      updateError('profile', error.message || 'Erro ao salvar perfil');
      return false;
    } finally {
      updateLoading('saving', false);
    }
  }, [state.userId, state.teamId]);

  // Carregar respostas do questionário
  const loadSurveyResponses = useCallback(async () => {
    try {
      updateLoading('survey', true);
      
      if (!state.userId || !state.teamId) {
        const ids = await fetchTeamMemberId();
        if (!ids) {
          throw new Error("IDs do usuário e equipe não encontrados");
        }
        updateUserId(ids.userId);
        updateTeamId(ids.teamId);
      }
      
      if (!state.userId || !state.teamId) {
        throw new Error("IDs do usuário e equipe não encontrados");
      }
      
      const surveyResponse = await SurveyService.loadSurveyResponses(state.userId, state.teamId);
      
      if (surveyResponse) {
        setState(prev => ({ 
          ...prev, 
          surveyResponses: surveyResponse.responses,
          error: { ...prev.error, survey: null }
        }));
        setAnswers(surveyResponse.responses);
      }
      
      return surveyResponse;
    } catch (error: any) {
      updateError('survey', error.message || 'Erro ao carregar respostas');
      return null;
    } finally {
      updateLoading('survey', false);
    }
  }, [state.userId, state.teamId]);

  // Salvar respostas do questionário
  const saveSurveyResponses = useCallback(async (data: SurveyFormValues): Promise<boolean> => {
    try {
      updateLoading('saving', true);
      
      if (!state.userId || !state.teamId) {
        throw new Error('IDs do usuário e equipe não encontrados');
      }
      
      await SurveyService.saveSurveyResponses(state.userId, state.teamId, data);
      
      setState(prev => ({ 
        ...prev, 
        surveyResponses: data,
        error: { ...prev.error, survey: null }
      }));

      return true;
    } catch (error: any) {
      updateError('survey', error.message || 'Erro ao salvar respostas');
      return false;
    } finally {
      updateLoading('saving', false);
    }
  }, [state.userId, state.teamId]);

  // Carregar respostas das perguntas abertas
  const loadOpenQuestions = useCallback(async () => {
    try {
      updateLoading('openQuestions', true);
      
      if (!state.userId || !state.teamId) {
        const result = await fetchTeamMemberId();
        if (!result) {
          throw new Error("IDs do usuário e equipe não encontrados");
        }
      }
      
      if (!state.userId || !state.teamId) {
        throw new Error("IDs do usuário e equipe não encontrados");
      }
      
      const openQuestions = await SurveyService.loadOpenQuestions(state.userId, state.teamId);
      
      if (openQuestions) {
        setState(prev => ({ ...prev, openQuestions }));
      }
      
      return openQuestions;
    } catch (error: any) {
      console.error('Erro ao carregar respostas das perguntas abertas:', error);
      updateError('openQuestions', error.message || 'Erro ao carregar respostas das perguntas abertas');
      return null;
    } finally {
      updateLoading('openQuestions', false);
    }
  }, [state.userId, state.teamId, fetchTeamMemberId]);

  // Salvar respostas das perguntas abertas
  const saveOpenQuestions = useCallback(async (data: OpenQuestionsFormValues): Promise<boolean> => {
    try {
      updateLoading('saving', true);
      
      if (!state.userId || !state.teamId) {
        const result = await fetchTeamMemberId();
        if (!result) {
          throw new Error("IDs do usuário e equipe não encontrados");
        }
      }
      
      if (!state.userId || !state.teamId) {
        throw new Error("IDs do usuário e equipe não encontrados");
      }
      
      const success = await SurveyService.saveOpenQuestions(state.userId, state.teamId, data);
      
      if (success) {
        const savedData = await SurveyService.loadOpenQuestions(state.userId, state.teamId);
        if (savedData) {
          setState(prev => ({ 
            ...prev, 
            openQuestions: savedData,
            error: { ...prev.error, openQuestions: null }
          }));
        }
        
        const isComplete = await SurveyService.checkSurveyCompletion(state.userId, state.teamId);
        
        if (isComplete) {
          await SurveyService.updateMemberStatus(state.userId, 'answered');
        }
      }
      
      return success;
    } catch (error: any) {
      updateError('openQuestions', error.message || 'Erro ao salvar respostas');
      return false;
    } finally {
      updateLoading('saving', false);
    }
  }, [state.userId, state.teamId, fetchTeamMemberId]);
  
  // Função para marcar todas as etapas como concluídas
  const completeAllSteps = useCallback(async () => {
    try {
      updateLoading('saving', true);
      
      if (!state.userId || !state.teamId) {
        const ids = await fetchTeamMemberId();
        if (!ids) {
          throw new Error("IDs do usuário e equipe não encontrados");
        }
        updateUserId(ids.userId);
        updateTeamId(ids.teamId);
      }
      
      if (!state.userId || !state.teamId) {
        throw new Error("IDs do usuário e equipe não encontrados");
      }
      
      const isComplete = await SurveyService.checkSurveyCompletion(state.userId, state.teamId);
      
      if (isComplete) {
        await SurveyService.updateMemberStatus(state.userId, 'answered');
      }
      
      return isComplete;
    } catch (error: any) {
      updateError('profile', error.message || 'Erro ao verificar conclusão das etapas');
      return false;
    } finally {
      updateLoading('saving', false);
    }
  }, [state.userId, state.teamId]);

  // Salvar respostas
  const saveAnswers = useCallback(async (responses: SurveyResponses): Promise<boolean> => {
    try {
      updateLoading('survey', true);
      
      if (!state.userId || !state.teamId) {
        throw new Error('ID do usuário ou equipe não encontrado');
      }

      await SurveyService.saveSurveyResponses(state.userId, state.teamId, responses);
      
      setState(prev => ({
        ...prev,
        surveyResponses: responses,
        answers: responses
      }));

      return true;
    } catch (error: any) {
      updateError('survey', error.message || 'Erro ao salvar respostas');
      return false;
    } finally {
      updateLoading('survey', false);
    }
  }, [state.userId, state.teamId]);

  // Função para gerar dados do radar
  const generateRadarData = useCallback(async () => {
    try {
      if (!state.surveyResponses) return;
      
      const radarPoints = Object.entries(state.surveyResponses)
        .map(([key, value]) => ({
          category: SurveyService.getCompetencyName(key),
          value
        }));
      
      setRadarData(radarPoints);
    } catch (error) {
      console.error('Erro ao gerar dados do radar:', error);
    }
  }, [state.surveyResponses]);

  // Inicializar questões e seções
  useEffect(() => {
    const questions = [
      {
        id: "q1",
        competency: "Abertura",
        text: "O ambiente de trabalho facilita o feedback positivo ou negativo de mão dupla entre o líder e os membros da equipe?",
      },
      {
        id: "q2",
        competency: "Agilidade",
        text: "No ambiente de trabalho, você age e reage rapidamente, assume riscos, considera diferentes cenários, experimenta ideias e aprende com as falhas?",
      },
      {
        id: "q3",
        competency: "Confiança",
        text: "No ambiente de trabalho, você acredita que a relação profissional entre o líder e a equipe é baseada na confiança mútua?",
      },
      {
        id: "q4",
        competency: "Empatia",
        text: "Nas relações profissionais, você compreende, tem empatia e considera a perspectiva e os sentimentos dos outros, e percebe que o mesmo é recíproco?",
      },
      {
        id: "q5",
        competency: "Articulação",
        text: "No ambiente de trabalho, as conexões entre as competências dos membros da equipe e as externas ao squad/projeto são potencializadas, maximizadas e bem utilizadas?",
      },
      {
        id: "q6",
        competency: "Adaptabilidade",
        text: "No ambiente de trabalho, você consegue se adaptar rapidamente e responder às adversidades que ocorrem em situações não planejadas?",
      },
      {
        id: "q7",
        competency: "Inovação",
        text: "O ambiente de trabalho favorece, estimula e desenvolve as competências necessárias para a busca da inovação nos indivíduos?",
      },
      {
        id: "q8",
        competency: "Comunicação",
        text: "No ambiente de trabalho, a comunicação é facilitada e ocorre de forma fluida, permitindo que você se comunique interna e externamente através de várias formas e canais?",
      },
      {
        id: "q9",
        competency: "Descentralização",
        text: "No ambiente de trabalho diário, a tomada de decisão é participativa e compartilhada entre a gestão e a equipe, em vez de concentrada em uma pessoa?",
      },
      {
        id: "q10",
        competency: "Auto-organização",
        text: "No ambiente de trabalho, a equipe se auto-organiza e se esforça coletivamente para resolver uma tarefa complexa ou um desafio inesperado?",
      },
      {
        id: "q11",
        competency: "Colaboração",
        text: "No ambiente de trabalho, os desafios são tratados de forma colaborativa, aproveitando efetivamente as competências individuais dos membros da equipe?",
      },
      {
        id: "q12",
        competency: "Resiliência",
        text: "No ambiente de trabalho, você considera que mantém uma atitude positiva, proativa e de aprendizado diante de obstáculos e fracassos?",
      },
    ];


    setQuestions(questions);
  }, []);

  // Carregar dados
  const loadData = useCallback(async () => {
    if (!state.userId || !state.teamId) return;

    try {
      updateLoading('profile', true);
      updateLoading('survey', true);
      updateLoading('openQuestions', true);

      const [profile, surveyResponses, openQuestions] = await Promise.all([
        SurveyService.loadProfile(state.userId, state.teamId),
        SurveyService.loadSurveyResponses(state.userId, state.teamId),
        SurveyService.loadOpenQuestions(state.userId, state.teamId)
      ]);

      setState(prev => ({
        ...prev,
        profile,
        surveyResponses: surveyResponses?.responses || null,
        openQuestions,
      }));
    } catch (error: any) {
      updateError('profile', error.message);
    } finally {
      updateLoading('profile', false);
      updateLoading('survey', false);
      updateLoading('openQuestions', false);
    }
  }, [state.userId, state.teamId]);

  const value = useMemo(() => ({
    ...state,
    saveAnswers,
    generateRadarData,
    saveProfile,
    saveSurveyResponses,
    saveOpenQuestions,
    updateUserId,
    updateTeamId,
    updateError,
    updateLoading,
    loadData,
    completeAllSteps
  }), [
    state,
    saveAnswers,
    generateRadarData,
    saveProfile,
    saveSurveyResponses,
    saveOpenQuestions,
    updateUserId,
    updateTeamId,
    updateError,
    updateLoading,
    loadData,
    completeAllSteps
  ]);

  return (
    <SurveyContext.Provider value={value}>
      {children}
    </SurveyContext.Provider>
  );
}; 