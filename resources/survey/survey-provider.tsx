'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import SurveyContext from './survey-context';
import { SurveyService } from './survey.service';
import { 
  ProfileFormValues,
  OpenQuestionsFormValues,
  SurveyState,
  Question,
  SurveyFormValues,
  RadarDataPoint,
  SurveyResponses
} from './survey-model';
import { useAuth } from '@/resources/auth/auth-hook';
import { useTeam } from '@/resources/team/team-hook';
import { supabase } from '../auth/auth.service';

interface SurveyProviderProps {
  children: ReactNode;
}

const initialState: SurveyState = {
  profile: null,
  surveyResponses: null,
  openQuestions: null,
  teamMemberId: null,
  isLoading: false,
  error: null,
  radarData: []
};

export function SurveyProvider({ children }: SurveyProviderProps) {
  const [state, setState] = useState<SurveyState>(initialState);
  const { user } = useAuth();
  const { selectedTeam, teamMembers, loadTeamMembers } = useTeam();
  
  // Estados adicionais para pesquisa
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);

  // Método para atualizar o estado de loading e erro
  const updateLoading = useCallback((isLoading: boolean, error: string | null = null) => {
    setState(prev => ({ ...prev!, isLoading, error }));
  }, []);

  // Método para atualizar o teamMemberId
  const updateTeamMemberId = useCallback((teamMemberId: string | null) => {
    if (teamMemberId) {
      setState(prev => ({ ...prev!, teamMemberId }));
    }
  }, []);

  // Buscar o ID do membro da equipe com base no email do usuário e no ID da equipe
  const fetchTeamMemberId = useCallback(async () => {
    if (!user?.email) return null;
    
    try {
      updateLoading(true);
      
      const teamId = selectedTeam?.id || localStorage.getItem("teamId");
      
      if (!teamId) {
        throw new Error("ID da equipe não encontrado");
      }
      
      if (teamMembers.length === 0) {
        await loadTeamMembers(teamId);
      }
      
      const member = teamMembers.find(m => m.email === user.email);
      
      if (!member) {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', teamId)
          .eq('email', user.email)
          .single();
        
        if (error) {
          const { data: newMember, error: insertError } = await supabase
            .from('team_members')
            .insert({
              team_id: teamId,
              email: user.email,
              role: 'member',
              status: 'invited',
              user_id: user.id
            })
            .select('*')
            .single();
          
          if (insertError) {
            throw new Error(`Erro ao criar membro da equipe: ${insertError.message}`);
          }
          
          updateTeamMemberId(newMember.id);
          updateLoading(false);
          return newMember.id;
        }
        
        updateTeamMemberId(data.id);
        updateLoading(false);
        return data.id;
      }
      
      if (member.id) {
        updateTeamMemberId(member.id);
        updateLoading(false);
        return member.id;
      }
      
      throw new Error("ID do membro da equipe não encontrado");
    } catch (error: any) {
      console.error('Erro ao buscar ID do membro da equipe:', error);
      updateLoading(false, error.message || 'Erro ao buscar ID do membro da equipe');
      return null;
    }
  }, [user, selectedTeam, teamMembers, updateLoading, updateTeamMemberId]);

  // Carregar dados do perfil do usuário
  const loadProfile = useCallback(async () => {
    try {
      updateLoading(true);
      
      const teamMemberId = state.teamMemberId || await fetchTeamMemberId();
      
      if (!teamMemberId) {
        throw new Error("ID do membro da equipe não encontrado");
      }
      
      const profile = await SurveyService.loadProfile(teamMemberId);
      
      setState(prev => ({ ...prev!, profile }));
      updateLoading(false);
      
      return profile;
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      updateLoading(false, error.message || 'Erro ao carregar perfil');
      return null;
    }
  }, [state.teamMemberId, updateLoading, fetchTeamMemberId]);

  // Salvar perfil do usuário
  const saveProfile = useCallback(async (data: ProfileFormValues): Promise<boolean> => {
    try {
      updateLoading(true);
      
      const teamMemberId = state.teamMemberId || await fetchTeamMemberId();
      
      if (!teamMemberId) {
        throw new Error("ID do membro da equipe não encontrado");
      }
      
      await SurveyService.saveProfile(teamMemberId, data);
      
      const profile = await loadProfile();
      setState(prev => ({ ...prev!, profile }));
      updateTeamMemberId(teamMemberId);
      updateLoading(false);
      
      return true;
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      updateLoading(false, error.message || 'Erro ao salvar perfil');
      return false;
    }
  }, [state.teamMemberId, updateLoading, updateTeamMemberId, loadProfile, fetchTeamMemberId]);

  // Carregar respostas do questionário
  const loadSurveyResponses = useCallback(async () => {
    try {
      updateLoading(true);
      
      const teamMemberId = state.teamMemberId || await fetchTeamMemberId();
      
      if (!teamMemberId) {
        throw new Error("ID do membro da equipe não encontrado");
      }
      
      const surveyResponse = await SurveyService.loadSurveyResponses(teamMemberId);
      
      if (surveyResponse) {
        setState(prev => ({ ...prev!, surveyResponses: surveyResponse.responses }));
        setAnswers(surveyResponse.responses);
      }
      
      updateLoading(false);
      return surveyResponse;
    } catch (error: any) {
      console.error('Erro ao carregar respostas do questionário:', error);
      updateLoading(false, error.message || 'Erro ao carregar respostas do questionário');
      return null;
    }
  }, [state.teamMemberId, updateLoading, fetchTeamMemberId]);

  // Salvar respostas do questionário
  const saveSurveyResponses = useCallback(async (data: SurveyFormValues) => {
    try {
      updateLoading(true);
      
      const teamMemberId = state.teamMemberId || await fetchTeamMemberId();
      
      if (!teamMemberId) {
        throw new Error("ID do membro da equipe não encontrado");
      }
      
      await SurveyService.saveSurveyResponses(teamMemberId, data);
      
      setState(prev => ({ ...prev!, surveyResponses: data }));
      updateLoading(false);
    } catch (error: any) {
      console.error('Erro ao salvar respostas do questionário:', error);
      updateLoading(false, error.message || 'Erro ao salvar respostas do questionário');
      throw error;
    }
  }, [state.teamMemberId]);

  // Carregar respostas das perguntas abertas
  const loadOpenQuestions = useCallback(async () => {
    try {
      updateLoading(true);
      
      const teamMemberId = state.teamMemberId || await fetchTeamMemberId();
      
      if (!teamMemberId) {
        throw new Error("ID do membro da equipe não encontrado");
      }
      
      const openQuestions = await SurveyService.loadOpenQuestions(teamMemberId);
      
      if (openQuestions) {
        setState(prev => ({ ...prev!, openQuestions }));
      }
      
      updateLoading(false);
      return openQuestions;
    } catch (error: any) {
      console.error('Erro ao carregar respostas das perguntas abertas:', error);
      updateLoading(false, error.message || 'Erro ao carregar respostas das perguntas abertas');
      return null;
    }
  }, [state.teamMemberId]);

  // Salvar respostas das perguntas abertas
  const saveOpenQuestions = useCallback(async (data: OpenQuestionsFormValues): Promise<boolean> => {
    try {
      updateLoading(true);
      
      const teamMemberId = state.teamMemberId || await fetchTeamMemberId();
      
      if (!teamMemberId) {
        throw new Error("ID do membro da equipe não encontrado");
      }
      
      await SurveyService.saveOpenQuestions(teamMemberId, data);
      
      setState(prev => ({ ...prev!, openQuestions: data }));
      
      const isComplete = await SurveyService.checkSurveyCompletion(teamMemberId);
      
      if (isComplete) {
        await SurveyService.updateMemberStatus(teamMemberId, 'answered');
      }
      
      updateLoading(false);
      return true;
    } catch (error: any) {
      console.error('Erro ao salvar respostas das perguntas abertas:', error);
      updateLoading(false, error.message || 'Erro ao salvar respostas das perguntas abertas');
      return false;
    }
  }, [state.teamMemberId]);
  
  // Função para marcar todas as etapas como concluídas
  const completeAllSteps = useCallback(async () => {
    try {
      updateLoading(true);
      
      const teamMemberId = state.teamMemberId || await fetchTeamMemberId();
      
      if (!teamMemberId) {
        throw new Error("ID do membro da equipe não encontrado");
      }
      
      const isComplete = await SurveyService.checkSurveyCompletion(teamMemberId);
      
      if (isComplete) {
        await SurveyService.updateMemberStatus(teamMemberId, 'answered');
      }
      
      updateLoading(false);
      return isComplete;
    } catch (error: any) {
      console.error('Erro ao verificar conclusão das etapas:', error);
      updateLoading(false, error.message || 'Erro ao verificar conclusão das etapas');
      return false;
    }
  }, [state.teamMemberId]);

  // Função para salvar respostas
  const saveAnswers = useCallback(async (responses: SurveyResponses) => {
    try {
      console.log('Salvando respostas no provider:', responses);
      
      if (!state.teamMemberId) {
        const teamMemberId = await fetchTeamMemberId();
        if (!teamMemberId) {
          throw new Error('ID do membro da equipe não encontrado');
        }
      }
      
      // Atualizar estado local primeiro
      setState(prev => ({
        ...prev,
        surveyResponses: responses,
        answers: responses
      }));
      
      // Persistir no banco
      await SurveyService.saveSurveyResponses(state.teamMemberId!, responses);
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar respostas:', error);
      return false;
    }
  }, [state.teamMemberId, fetchTeamMemberId]);

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

  // Carregar dados quando o teamMemberId mudar
  useEffect(() => {
    const loadData = async () => {
      if (!state.teamMemberId) return;

      try {
        const [profileData, surveyResponse, openQuestionsData] = await Promise.all([
          loadProfile(),
          loadSurveyResponses(),
          loadOpenQuestions()
        ]);

        if (surveyResponse?.responses) {
          const transformedData = Object.entries(surveyResponse.responses)
            .map(([key, value]) => ({
              category: SurveyService.getCompetencyName(key),
              value
            }));

          setRadarData(transformedData);
        }
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error);
        updateLoading(false, error.message);
      }
    };

    loadData();
  }, [state.teamMemberId]);

  return (
    <SurveyContext.Provider
      value={{
        answers: state.surveyResponses,
        profile: state.profile,
        surveyResponses: state.surveyResponses,
        openQuestions: state.openQuestions,
        isLoading: state.isLoading,
        error: state.error,
        questions,
        saveAnswers,
        generateRadarData,
        radarData: state.radarData || [],
        saveProfile,
        saveOpenQuestions,
        updateTeamMemberId,
        completeAllSteps,
        teamMemberId: state.teamMemberId,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
} 