import { createClient } from '@supabase/supabase-js';
import { 
  UserProfile, 
  SurveyResponse, 
  OpenQuestionResponse, 
  ProfileFormValues,
  OpenQuestionResponses, 
  SurveyResponses,
  SurveyFormValues
} from './survey-model';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export class SurveyService {
  /**
   * Carrega o perfil do usuário
   * @param teamMemberId ID do membro da equipe
   * @returns Dados do perfil do usuário
   */
  static async loadProfile(teamMemberId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 é o código para "nenhum resultado encontrado"
        throw new Error(`Erro ao carregar perfil: ${error.message}`);
      }

      return data as UserProfile;
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      throw new Error(`Erro ao carregar perfil: ${error.message}`);
    }
  }

  /**
   * Salva o perfil do usuário
   * @param teamMemberId ID do membro da equipe
   * @param data Dados do perfil
   * @returns Dados do perfil salvos
   */
  static async saveProfile(teamMemberId: string, data: ProfileFormValues): Promise<UserProfile> {
    try {
      console.log("Dados recebidos para salvar:", data);
      
      // Criar uma cópia dos dados para não modificar o objeto original
      let formattedData = { ...data };
      
      // Função auxiliar para formatar datas
      const formatDateField = (dateValue: string | null | undefined): string | null => {
        if (!dateValue) return null;
        
        // Se já estiver no formato YYYY-MM-DD, retornar como está
        if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateValue;
        }
        
        // Se estiver no formato YYYY-MM, adicionar o último dia do mês
        if (dateValue.match(/^\d{4}-\d{2}$/)) {
          const [year, month] = dateValue.split('-');
          const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
          return `${dateValue}-${lastDay}`;
        }
        
        // Se o formato for inválido, retornar null
        return null;
      };
      
      // Formatar os campos de data independentemente
      formattedData.birth_date = formatDateField(formattedData.birth_date) || undefined;
      formattedData.graduation_date = formatDateField(formattedData.graduation_date) || undefined;
      
      // Converter employee_count para número
      if (typeof formattedData.employee_count === 'string') {
        formattedData.employee_count = parseInt(formattedData.employee_count, 10) || 0;
      }
      
      console.log("Dados formatados para salvar:", formattedData);

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .upsert({
          team_member_id: teamMemberId,
          ...formattedData,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar perfil:', error);
        throw new Error(`Erro ao salvar perfil: ${error.message}`);
      }

      return profile;
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      throw error;
    }
  }

  /**
   * Carrega as respostas do questionário
   * @param teamMemberId ID do membro da equipe
   * @returns Respostas do questionário
   */
  static async loadSurveyResponses(teamMemberId: string): Promise<SurveyResponses | null> {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Erro ao carregar respostas do questionário: ${error.message}`);
      }

      return data as SurveyResponses;
    } catch (error: any) {
      console.error('Erro ao carregar respostas do questionário:', error);
      throw new Error(`Erro ao carregar respostas do questionário: ${error.message}`);
    }
  }

  /**
   * Salva as respostas do questionário
   * @param teamMemberId ID do membro da equipe
   * @param data Respostas do questionário
   * @returns Respostas do questionário salvas
   */
  static async saveSurveyResponses(teamMemberId: string, data: SurveyFormValues): Promise<SurveyResponses> {
    try {
      console.log("Dados recebidos para salvar:", data);
      
      // Converter valores de string para número
      const numericData: SurveyResponses = {
        q1: parseInt(data.q1, 10),
        q2: parseInt(data.q2, 10),
        q3: parseInt(data.q3, 10),
        q4: parseInt(data.q4, 10),
        q5: parseInt(data.q5, 10),
        q6: parseInt(data.q6, 10),
        q7: parseInt(data.q7, 10),
        q8: parseInt(data.q8, 10),
        q9: parseInt(data.q9, 10),
        q10: parseInt(data.q10, 10),
        q11: parseInt(data.q11, 10),
        q12: parseInt(data.q12, 10),
      };
      
      console.log("Dados convertidos para salvar:", numericData);
      
      // Verificar se já existem respostas
      const { data: existingResponses } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('team_member_id', teamMemberId)
        .maybeSingle();

      let result;

      if (existingResponses) {
        // Atualizar respostas existentes
        const { data: updatedResponses, error } = await supabase
          .from('survey_responses')
          .update({
            ...numericData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingResponses.id)
          .select('*')
          .single();

        if (error) {
          throw new Error(`Erro ao atualizar respostas do questionário: ${error.message}`);
        }

        result = updatedResponses;
      } else {
        // Criar novas respostas
        const { data: newResponses, error } = await supabase
          .from('survey_responses')
          .insert({
            team_member_id: teamMemberId,
            ...numericData,
          })
          .select('*')
          .single();

        if (error) {
          throw new Error(`Erro ao criar respostas do questionário: ${error.message}`);
        }

        result = newResponses;
      }

      // Verificar se todas as etapas estão completas
      const isComplete = await this.checkSurveyCompletion(teamMemberId);
      
      if (isComplete) {
        // Obter o team_id e email do membro
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('team_id, email, status')
          .eq('id', teamMemberId)
          .single();
          
        if (memberError) {
          console.error('Erro ao buscar dados do membro:', memberError);
        } else if (memberData && memberData.status !== 'completed') {
          // Atualizar o status para completed
          await supabase
            .from('team_members')
            .update({ status: 'completed' })
            .eq('id', teamMemberId);
            
          console.log(`Status do membro ${teamMemberId} atualizado para 'completed'`);
        }
      }

      return result as SurveyResponses;
    } catch (error: any) {
      console.error('Erro ao salvar respostas do questionário:', error);
      throw new Error(`Erro ao salvar respostas do questionário: ${error.message}`);
    }
  }

  /**
   * Carrega as respostas das perguntas abertas
   * @param teamMemberId ID do membro da equipe
   * @returns Respostas das perguntas abertas
   */
  static async loadOpenQuestionResponses(teamMemberId: string): Promise<OpenQuestionResponses | null> {
    try {
      const { data, error } = await supabase
        .from('open_question_responses')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Erro ao carregar respostas das perguntas abertas: ${error.message}`);
      }

      return data as OpenQuestionResponses;
    } catch (error: any) {
      console.error('Erro ao carregar respostas das perguntas abertas:', error);
      throw new Error(`Erro ao carregar respostas das perguntas abertas: ${error.message}`);
    }
  }

  /**
   * Salva as respostas das perguntas abertas
   * @param teamMemberId ID do membro da equipe
   * @param data Respostas das perguntas abertas
   * @returns Respostas das perguntas abertas salvas
   */
  static async saveOpenQuestionResponses(teamMemberId: string, data: OpenQuestionResponses): Promise<OpenQuestionResponses> {
    try {
      // Verificar se já existem respostas
      const { data: existingResponses } = await supabase
        .from('open_question_responses')
        .select('id')
        .eq('team_member_id', teamMemberId)
        .maybeSingle();

      let result;

      if (existingResponses) {
        // Atualizar respostas existentes
        const { data: updatedResponses, error } = await supabase
          .from('open_question_responses')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingResponses.id)
          .select('*')
          .single();

        if (error) {
          throw new Error(`Erro ao atualizar respostas das perguntas abertas: ${error.message}`);
        }

        result = updatedResponses;
      } else {
        // Criar novas respostas
        const { data: newResponses, error } = await supabase
          .from('open_question_responses')
          .insert({
            team_member_id: teamMemberId,
            ...data,
          })
          .select('*')
          .single();

        if (error) {
          throw new Error(`Erro ao criar respostas das perguntas abertas: ${error.message}`);
        }

        result = newResponses;
      }

      return result as OpenQuestionResponses;
    } catch (error: any) {
      console.error('Erro ao salvar respostas das perguntas abertas:', error);
      throw new Error(`Erro ao salvar respostas das perguntas abertas: ${error.message}`);
    }
  }

  /**
   * Verifica o status atual do membro da equipe
   * @param teamMemberId ID do membro da equipe
   * @returns Status atual do membro
   */
  static async checkMemberStatus(teamMemberId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('status')
        .eq('id', teamMemberId)
        .single();
      
      if (error) {
        console.error('Erro ao verificar status do membro:', error);
        return null;
      }
      
      return data?.status || null;
    } catch (error) {
      console.error('Erro ao verificar status do membro:', error);
      return null;
    }
  }

  /**
   * Atualiza o status do membro da equipe
   * @param teamMemberId ID do membro da equipe
   * @param status Novo status
   */
  static async updateMemberStatus(teamMemberId: string, status: 'enviado' | 'cadastrado' | 'respondido'): Promise<void> {
    try {
      // Verificar o status atual
      const currentStatus = await this.checkMemberStatus(teamMemberId);
      console.log(`Status atual do membro ${teamMemberId}: "${currentStatus}"`);
      
      // Mapear status em português para inglês (conforme constraint do banco)
      let dbStatus: string;
      switch (status.trim().toLowerCase()) {
        case 'enviado':
          dbStatus = 'invited'; // 'enviado' corresponde a 'invited'
          break;
        case 'cadastrado':
          dbStatus = 'registered'; // 'cadastrado' corresponde a 'registered'
          break;
        case 'respondido':
          dbStatus = 'completed'; // 'respondido' corresponde a 'completed'
          break;
        default:
          throw new Error(`Status inválido: ${status}. Deve ser 'enviado', 'cadastrado' ou 'respondido'.`);
      }
      
      // Se o status atual for igual ao novo status mapeado, não fazer nada
      if (currentStatus === dbStatus) {
        console.log(`Status já está como "${dbStatus}". Nenhuma atualização necessária.`);
        return;
      }
      
      console.log(`Atualizando status do membro ${teamMemberId} para: "${dbStatus}" (original: "${status}")`);
      
      // Tentar atualizar usando o método padrão
      try {
        const { error } = await supabase
          .from('team_members')
          .update({ status: dbStatus })
          .eq('id', teamMemberId);
        
        if (error) {
          console.error('Erro ao atualizar status (método padrão):', error);
          throw error;
        }
      } catch (updateError: any) {
        console.error('Erro ao atualizar status (método padrão):', updateError);
        
        // Se falhar, tentar uma abordagem alternativa com SQL bruto
        try {
          // Usar uma consulta SQL direta via função
          const { error: rpcError } = await supabase.rpc('update_member_status', {
            p_member_id: teamMemberId,
            p_status: dbStatus
          });
          
          if (rpcError) {
            console.error('Erro ao atualizar status (RPC):', rpcError);
            
            // Se a função RPC também falhar, tentar uma última abordagem
            const { error: rawError } = await supabase.from('team_members')
              .update({ 
                status: dbStatus,
                updated_at: new Date().toISOString() // Adicionar um campo extra para forçar a atualização
              })
              .eq('id', teamMemberId);
            
            if (rawError) {
              console.error('Erro ao atualizar status (última tentativa):', rawError);
              throw rawError;
            }
          }
        } catch (finalError: any) {
          console.error('Erro final ao atualizar status:', finalError);
          throw finalError;
        }
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status do membro:', error);
      throw new Error(`Erro ao atualizar status do membro: ${error.message}`);
    }
  }

  /**
   * Verifica se o usuário completou todas as etapas
   * @param teamMemberId ID do membro da equipe
   * @returns Verdadeiro se todas as etapas estiverem completas
   */
  static async checkSurveyCompletion(teamMemberId: string): Promise<boolean> {
    try {
      // Verificar perfil
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('team_member_id', teamMemberId)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      // Verificar respostas do questionário
      const { data: surveyResponses, error: surveyError } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('team_member_id', teamMemberId)
        .single();
      
      if (surveyError && surveyError.code !== 'PGRST116') throw surveyError;
      
      // Verificar respostas das perguntas abertas
      const { data: openQuestions, error: openError } = await supabase
        .from('open_question_responses')
        .select('id')
        .eq('team_member_id', teamMemberId)
        .single();
      
      if (openError && openError.code !== 'PGRST116') throw openError;
      
      // Retornar true se todas as etapas estiverem completas
      return !!profile && !!surveyResponses && !!openQuestions;
    } catch (error) {
      console.error('Erro ao verificar conclusão do questionário:', error);
      return false;
    }
  }

  /**
   * Carrega todos os dados do usuário
   * @param teamMemberId ID do membro da equipe
   * @returns Todos os dados do usuário
   */
  static async loadUserData(teamMemberId: string): Promise<{
    profile: UserProfile | null;
    surveyResponses: SurveyResponse | null;
    openQuestions: OpenQuestionResponse | null;
  }> {
    try {
      // Carregar perfil
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      // Carregar respostas do questionário
      const { data: surveyResponses, error: surveyError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .single();
      
      if (surveyError && surveyError.code !== 'PGRST116') throw surveyError;
      
      // Carregar respostas das perguntas abertas
      const { data: openQuestions, error: openError } = await supabase
        .from('open_question_responses')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .single();
      
      if (openError && openError.code !== 'PGRST116') throw openError;
      
      return {
        profile: profile || null,
        surveyResponses: surveyResponses || null,
        openQuestions: openQuestions || null,
      };
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      throw error;
    }
  }
} 