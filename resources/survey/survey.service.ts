import { createClient } from '@supabase/supabase-js';
import { 
  UserProfile, 
  SurveyResponse, 
  OpenQuestionResponse, 
  ProfileFormValues,
  SurveyResponses,
  OpenQuestionsFormValues,
  TeamMemberStatus
} from './survey-model';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Funções auxiliares para tratar erros do Supabase
const handleDataError = (error: any) => {
  if (error.code === 'PGRST116') return null;
  if (error.code === 'JWT expired') {
    console.warn('Sessão expirada, renovando...');
    return null;
  }
  throw error;
};

const handleBooleanError = (error: any): boolean => {
  if (error.code === 'PGRST116' || error.code === 'JWT expired') {
    if (error.code === 'JWT expired') {
      console.warn('Sessão expirada, renovando...');
    }
    return false;
  }
  throw error;
};

interface SurveyResponseData {
  q1?: number | null;
  q2?: number | null;
  q3?: number | null;
  q4?: number | null;
  q5?: number | null;
  q6?: number | null;
  q7?: number | null;
  q8?: number | null;
  q9?: number | null;
  q10?: number | null;
  q11?: number | null;
  q12?: number | null;
}

export class SurveyService {
  static async loadProfile(userId: string, teamId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil:', error);
        return handleDataError(error);
      }

      return data;
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      return null;
    }
  }

  static async saveProfile(userId: string, teamId: string, profile: ProfileFormValues): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          team_id: teamId,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) return handleBooleanError(error);
      return true;
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      return false;
    }
  }

  static async loadSurveyResponses(userId: string, teamId: string): Promise<SurveyResponse | null> {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar respostas:', error);
        return handleDataError(error);
      }
      
      if (!data) return null;
      
      const responses: SurveyResponses = {};
      for (let i = 1; i <= 12; i++) {
        const key = `q${i}`;
        if (data[key] !== null) {
          responses[key] = data[key];
        }
      }
      
      return {
        id: data.id,
        user_id: data.user_id,
        team_id: data.team_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        is_complete: data.is_complete,
        responses
      };
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
      return null;
    }
  }

  static async saveSurveyResponses(userId: string, teamId: string, responses: SurveyResponses): Promise<boolean> {
    try {
      // Verificar se todas as 12 questões foram respondidas
      const isComplete = Array.from({ length: 12 }, (_, i) => `q${i + 1}`)
        .every(q => responses[q] !== undefined && responses[q] !== null);

      const dbResponses = {
        user_id: userId,
        team_id: teamId,
        updated_at: new Date().toISOString(),
        is_complete: isComplete,
        ...responses
      };

      const { error } = await supabase
        .from('survey_responses')
        .upsert(dbResponses, {
          onConflict: 'user_id,team_id'
        });

      if (error) return handleBooleanError(error);

      // Se salvou com sucesso e está completo, atualizar o status do membro
      if (isComplete) {
        await this.updateMemberStatus(userId, 'answered');
      }

      return true;
    } catch (error) {
      console.error('Erro ao salvar respostas:', error);
      return false;
    }
  }

  static async loadOpenQuestions(userId: string, teamId: string): Promise<OpenQuestionResponse | null> {
    try {
      const { data, error } = await supabase
        .from('open_question_responses')
        .select('*')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar perguntas abertas:', error);
        return handleDataError(error);
      }

      return data;
    } catch (error) {
      console.error('Erro ao carregar perguntas abertas:', error);
      return null;
    }
  }

  static async saveOpenQuestions(userId: string, teamId: string, answers: OpenQuestionsFormValues): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('open_question_responses')
        .upsert({
          user_id: userId,
          team_id: teamId,
          ...answers,
          updated_at: new Date().toISOString()
        });

      if (error) return handleBooleanError(error);
      return true;
    } catch (error) {
      console.error('Erro ao salvar perguntas abertas:', error);
      return false;
    }
  }

  static async getMemberStatus(teamMemberId: string): Promise<TeamMemberStatus | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('status')
        .eq('id', teamMemberId)
        .single();

      if (error) return handleDataError(error);
      return data?.status || null;
    } catch (error) {
      console.error('Erro ao obter status do membro:', error);
      return null;
    }
  }

  static async updateMemberStatus(teamMemberId: string, status: TeamMemberStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamMemberId);

      if (error) return handleBooleanError(error);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do membro:', error);
      return false;
    }
  }

  static async checkSurveyCompletion(userId: string, teamId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('is_complete')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .single();

      if (error) return handleBooleanError(error);
      return data?.is_complete || false;
    } catch (error) {
      console.error('Erro ao verificar conclusão do questionário:', error);
      return false;
    }
  }

  static getCompetencyName(questionId: string): string {
    const competencies: Record<string, string> = {
      q1: 'Liderança',
      q2: 'Comunicação',
      q3: 'Trabalho em Equipe',
      q4: 'Resolução de Problemas',
      q5: 'Inovação',
      q6: 'Adaptabilidade',
      q7: 'Gestão do Tempo',
      q8: 'Pensamento Crítico',
      q9: 'Ética Profissional',
      q10: 'Conhecimento Técnico',
      q11: 'Aprendizado Contínuo',
      q12: 'Orientação a Resultados'
    };

    return competencies[questionId] || questionId;
  }

  static async getTeamResults(teamId: string) {
    try {
      // Buscar todos os membros da equipe com suas respostas
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select(`
          id,
          role,
          survey_responses!inner (
            q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'answered');

      if (membersError) throw membersError;
      if (!members?.length) return null;

      // Separar líder e membros
      const leader = members.find(m => m.role === 'leader');
      const teamMembers = members.filter(m => m.role === 'member');

      if (!leader || !teamMembers.length) return null;

      // Extrair respostas do líder
      const leaderResponses = leader.survey_responses;
      if (!leaderResponses) return null;

      // Definir IDs das questões
      const questionIds = Array.from({ length: 12 }, (_, i) => `q${i + 1}` as keyof SurveyResponseData);

      // Calcular média da equipe por questão
      const teamAverage = questionIds.map(questionId => {
        const values = teamMembers
          .map(member => (member.survey_responses as SurveyResponseData)?.[questionId])
          .filter((value): value is number => value !== undefined && value !== null);

        const average = values.length
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : 0;

        return {
          questionId,
          average: Number(average.toFixed(2))
        };
      });

      // Formatar respostas do líder
      const formattedLeaderResponses = questionIds.map(questionId => {
        const value = (leader.survey_responses as SurveyResponseData)?.[questionId];
        return {
          questionId,
          value: value !== undefined && value !== null ? Number(value) : 0
        };
      });

      return {
        teamAverage,
        leaderResponses: formattedLeaderResponses
      };
    } catch (error) {
      console.error('Erro ao carregar resultados da equipe:', error);
      return null;
    }
  }
}