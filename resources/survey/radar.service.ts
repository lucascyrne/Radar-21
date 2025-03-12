import { createClient } from '@supabase/supabase-js';
import { SurveyResponses } from './survey-model';
import { TeamMember } from '../team/team-model';
import { RadarDataPoint } from '@/components/radar-chart';

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
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('team_member_id', memberId)
        .single();
        
      if (error) {
        console.error('Erro ao carregar respostas do membro:', error);
        return null;
      }
      
      // Armazenar no cache
      responsesCache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
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
  ): Promise<Record<string, SurveyResponses | null>> {
    // Verificar cache
    const cacheKey = `team_${teamId}`;
    const cachedData = teamResponsesCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION) {
      return cachedData.data;
    }
    
    try {
      // Filtrar apenas membros que responderam ao questionário
      const completedMembers = teamMembers.filter(
        member => member.status === 'completed' || member.status === 'respondido'
      );
      
      if (completedMembers.length === 0) {
        return {};
      }
      
      // Buscar respostas para cada membro
      const memberResponses: Record<string, SurveyResponses | null> = {};
      
      for (const member of completedMembers) {
        if (member.id) {
          memberResponses[member.id] = await this.loadMemberResponses(member.id);
        }
      }
      
      // Armazenar no cache
      teamResponsesCache.set(cacheKey, { data: memberResponses, timestamp: Date.now() });
      
      return memberResponses;
    } catch (error) {
      console.error('Erro ao carregar respostas da equipe:', error);
      return {};
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
   * Calcula a média da equipe com base nas respostas individuais
   */
  static calculateTeamAverage(teamResponses: SurveyResponses[]): RadarDataPoint[] {
    if (!teamResponses || teamResponses.length === 0) return [];
    
    // Inicializar objeto para armazenar somas e contagens
    const topicSums: Record<string, { sum: number; count: number }> = {};
    
    // Inicializar tópicos
    Object.values(questionTopics).forEach(topic => {
      topicSums[topic] = { sum: 0, count: 0 };
    });
    
    // Processar respostas de cada membro
    teamResponses.forEach(responses => {
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
   * Obtém detalhes de competência comparando usuário com média da equipe
   */
  static getCompetencyDetails(
    userResponses: SurveyResponses | null,
    teamAverageData: RadarDataPoint[]
  ): CompetencyDetail[] {
    if (!userResponses) return [];
    
    const userRadarData = this.transformResponsesToRadarData(userResponses);
    
    return userRadarData.map(userData => {
      const teamData = teamAverageData.find(item => item.category === userData.category);
      const teamAverage = teamData ? teamData.value : 0;
      
      return {
        topic: userData.category,
        userScore: userData.value,
        teamAverage,
        difference: userData.value - teamAverage
      };
    });
  }
} 