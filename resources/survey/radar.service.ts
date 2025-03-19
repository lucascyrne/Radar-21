import { createClient } from '@supabase/supabase-js';
import { SurveyResponses } from './survey-model';
import { TeamMember } from '../team/team-model';
import { RadarDataPoint } from '@/components/survey/radar-chart';

// Inicializar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache para armazenar respostas e médias (5 minutos)
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutos em milissegundos
const responsesCache = new Map<string, { data: SurveyResponses | null, timestamp: number }>();
const teamResponsesCache = new Map<string, { data: Record<string, SurveyResponses | null>, timestamp: number }>();
const teamAverageCache = new Map<string, { data: RadarDataPoint[], timestamp: number }>();

// Mapeamento de perguntas para tópicos específicos (baseado no README.md)
export const questionTopics: Record<string, string> = {
  'q1': 'Abertura',
  'q2': 'Agilidade',
  'q3': 'Confiança',
  'q4': 'Empatia',
  'q5': 'Articulação',
  'q6': 'Adaptabilidade',
  'q7': 'Inovação',
  'q8': 'Comunicação',
  'q9': 'Descentralização',
  'q10': 'Auto-organização',
  'q11': 'Colaboração',
  'q12': 'Resiliência'
};

export interface CompetencyDetail {
  topic: string;
  userScore: number;
  teamAverage: number;
  difference: number;
}

export class RadarService {
  /**
   * Carrega as respostas de um membro específico
   */
  static async loadMemberResponses(memberId: string): Promise<SurveyResponses | null> {
    // Verificar cache
    const cacheKey = `member_${memberId}`;
    const cachedData = responsesCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION) {
      return cachedData.data;
    }
    
    try {
      // Primeiro, tentar buscar respostas da pesquisa
      const { data: surveyData, error: surveyError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('team_member_id', memberId)
        .single();
        
      if (surveyError && surveyError.code !== 'PGRST116') {
        console.error('Erro ao carregar respostas da pesquisa:', surveyError);
        return null;
      }
      
      if (surveyData) {
        // Armazenar no cache e retornar
        responsesCache.set(cacheKey, { data: surveyData, timestamp: Date.now() });
        return surveyData;
      }
      
      // Se não encontrou respostas da pesquisa, tentar buscar respostas das questões abertas
      const { data: openData, error: openError } = await supabase
        .from('open_question_responses')
        .select('*')
        .eq('team_member_id', memberId)
        .single();
        
      if (openError && openError.code !== 'PGRST116') {
        console.error('Erro ao carregar respostas das questões abertas:', openError);
        return null;
      }
      
      if (openData) {
        // Armazenar no cache e retornar
        responsesCache.set(cacheKey, { data: openData, timestamp: Date.now() });
        return openData;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao carregar respostas do membro:', error);
      return null;
    }
  }
  
  /**
   * Carrega as respostas de todos os membros de uma equipe
   */
  static async loadTeamResponses(
    teamId: string, 
    teamMembers: TeamMember[]
  ): Promise<{
    memberResponses: Record<string, SurveyResponses | null>,
    leaderResponses: SurveyResponses | null
  }> {
    // Verificar cache
    const cacheKey = `team_${teamId}`;
    const cachedData = teamResponsesCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION) {
      return cachedData.data as any;
    }
    
    try {
      // Filtrar apenas membros que responderam ao questionário
      const completedMembers = teamMembers.filter(
        member => member.status === 'answered'
      );
      
      if (completedMembers.length === 0) {
        return { memberResponses: {}, leaderResponses: null };
      }
      
      // Buscar respostas para cada membro
      const memberResponses: Record<string, SurveyResponses | null> = {};
      let leaderResponses: SurveyResponses | null = null;
      
      for (const member of completedMembers) {
        if (member.id) {
          const responses = await this.loadMemberResponses(member.id);
          if (member.role === 'leader') {
            leaderResponses = responses;
          } else {
            memberResponses[member.id] = responses;
          }
        }
      }
      
      const result = { memberResponses, leaderResponses };
      
      // Armazenar no cache
      teamResponsesCache.set(cacheKey, { data: result as any, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      console.error('Erro ao carregar respostas da equipe:', error);
      return { memberResponses: {}, leaderResponses: null };
    }
  }
  
  /**
   * Transforma respostas da pesquisa em dados para o radar
   */
  static transformResponsesToRadarData(responses: SurveyResponses | null): RadarDataPoint[] {
    if (!responses) return [];
    
    const radarData: RadarDataPoint[] = [];
    
    // Processar cada pergunta individualmente
    Object.entries(responses).forEach(([key, value]) => {
      if (key.startsWith('q') && questionTopics[key]) {
        const topic = questionTopics[key];
        const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
        
        // Verificar se o valor é um número válido
        if (numericValue !== null && numericValue !== undefined && !isNaN(Number(numericValue))) {
          radarData.push({
            category: topic,
            value: Number(numericValue)
          });
        }
      }
    });
    
    return radarData.sort((a, b) => a.category.localeCompare(b.category));
  }
  
  /**
   * Calcula a média da equipe com base nas respostas individuais (excluindo o líder)
   */
  static calculateTeamAverage(memberResponses: Record<string, SurveyResponses | null>): RadarDataPoint[] {
    const responses = Object.values(memberResponses).filter(Boolean) as SurveyResponses[];
    if (!responses || responses.length === 0) return [];
    
    // Inicializar objeto para armazenar somas e contagens
    const topicSums: Record<string, { sum: number; count: number }> = {};
    
    // Inicializar tópicos
    Object.values(questionTopics).forEach(topic => {
      topicSums[topic] = { sum: 0, count: 0 };
    });
    
    // Processar respostas de cada membro
    responses.forEach(responses => {
      if (!responses) return;
      
      Object.entries(responses).forEach(([key, value]) => {
        if (key.startsWith('q') && questionTopics[key]) {
          const topic = questionTopics[key];
          const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
          
          // Verificar se o valor é um número válido
          if (numericValue !== null && numericValue !== undefined && !isNaN(Number(numericValue))) {
            topicSums[topic].sum += Number(numericValue);
            topicSums[topic].count += 1;
          }
        }
      });
    });
    
    // Calcular média para cada tópico
    return Object.entries(topicSums)
      .filter(([_, values]) => values.count > 0)
      .map(([topic, values]) => {
        const average = values.sum / values.count;
        return {
          category: topic,
          value: parseFloat(average.toFixed(1))
        };
      })
      .sort((a, b) => a.category.localeCompare(b.category));
  }
  
  /**
   * Obtém detalhes de competência comparando líder com média da equipe
   */
  static getCompetencyDetails(leaderResponses: SurveyResponses | null, teamAverageData: RadarDataPoint[]): CompetencyDetail[] {
    if (!leaderResponses || teamAverageData.length === 0) {
      return [];
    }

    const details: CompetencyDetail[] = [];

    // Processar cada pergunta do questionário
    Object.entries(leaderResponses).forEach(([key, value]) => {
      // Verificar se a chave corresponde a uma pergunta (q1, q2, etc.)
      if (key.startsWith('q') && typeof value === 'number' && questionTopics[key]) {
        const topic = questionTopics[key]; // Usar o tópico mapeado em vez da chave
        const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
        
        // Encontrar a média da equipe para esta competência
        const teamData = teamAverageData.find(d => d.category === topic);
        const teamAverage = teamData?.value || 0;
        
        // Calcular o delta: Média da equipe - Líder
        // Um delta positivo indica que a equipe avalia melhor que o líder
        const difference = teamAverage - numericValue;

        details.push({
          topic,
          userScore: numericValue,
          teamAverage,
          difference
        });
      }
    });

    // Ordenar por nome da competência
    return details.sort((a, b) => a.topic.localeCompare(b.topic));
  }
} 