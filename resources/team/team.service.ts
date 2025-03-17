import { createClient } from '@supabase/supabase-js';
import { Team, TeamMember } from './team-model';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache para armazenar resultados de requisições
const cache = {
  teams: new Map<string, { data: any, timestamp: number }>(),
  members: new Map<string, { data: any, timestamp: number }>(),
  users: new Map<string, { data: any, timestamp: number }>(),
};

// Tempo de expiração do cache em milissegundos (5 minutos)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export class TeamService {
  /**
   * Busca um usuário pelo email
   * @param email Email do usuário
   * @returns ID do usuário ou null se não encontrado
   */
  static async getUserByEmail(email: string): Promise<string | null> {
    try {
      // Verificar se há dados em cache e se ainda são válidos
      const cacheKey = `user_${email}`;
      const cachedData = cache.users.get(cacheKey);
      if (cachedData) {
        const now = Date.now();
        if (now - cachedData.timestamp < CACHE_EXPIRATION) {
          return cachedData.data;
        }
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar usuário:', error);
        return null;
      }
      
      const userId = data?.id || null;
      
      // Armazenar resultado em cache
      cache.users.set(cacheKey, {
        data: userId,
        timestamp: Date.now()
      });
      
      return userId;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  /**
   * Cria uma nova equipe
   * @param name Nome da equipe
   * @param ownerId ID do proprietário da equipe
   * @param ownerEmail Email do proprietário da equipe
   * @param teamSize Tamanho da equipe
   * @returns Dados da equipe criada
   */
  static async createTeam(
    name: string,
    ownerId: string,
    ownerEmail: string,
    teamSize: number
  ): Promise<Team> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name,
          owner_id: ownerId,
          owner_email: ownerEmail,
          team_size: teamSize,
        })
        .select('*')
        .single()
      
      if (error) {
        console.error('Erro ao criar equipe:', error);
        throw new Error(`Erro ao criar equipe: ${error.message}`);
      }


      return data as Team;
    } catch (error: any) {      
      console.error('Erro ao criar equipe:', error);
      throw new Error(`Erro ao criar equipe: ${error.message}`);
    }
  }

  /**
   * Adiciona um membro à equipe
   * @param teamId ID da equipe
   * @param userId ID do usuário (pode ser null para convites)
   * @param email Email do membro
   * @param role Papel do membro na equipe
   * @param status Status do membro na equipe
   */
  static async addTeamMember(
    teamId: string,
    userId: string | null,
    email: string,
    role: string,
    status: string
  ): Promise<void> {
    try {      
      // Verificar se o membro já existe
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('email', email)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existingMember) {
        // Se o membro já existe, não rebaixar seu status
        // Por exemplo, não mudar de "answered" para "invited"
        let newStatus = status;
        
        // Lógica para não rebaixar status
        if (existingMember.status === 'answered' && status !== 'answered') {
          newStatus = 'answered';
        } else if (existingMember.status === 'invited' && status === 'invited') {
          newStatus = 'invited';
        }
        
        const updates: any = { status: newStatus };
        
        // Atualizar user_id apenas se for fornecido e diferente do atual
        if (userId && (!existingMember.user_id || existingMember.user_id !== userId)) {
          updates.user_id = userId;
        }
        
        const { error: updateError } = await supabase
          .from('team_members')
          .update(updates)
          .eq('id', existingMember.id)
        
        if (updateError) {
          throw updateError;
        }
      } else {
        // Se o membro não existe, criar novo
        // Membros convidados sempre começam com status "invited"
        const memberStatus = userId ? status : 'invited';
        
        const { error } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: userId,
            email,
            role,
            status: memberStatus
          })
        
        if (error) {
          throw error;
        }
      }
    } catch (error: any) {      
      console.error('Erro ao adicionar membro à equipe:', error);
      throw error;
    }
  }

  /**
   * Obtém as equipes do usuário
   * @param userId ID do usuário
   * @returns Lista de equipes e associações do usuário
   */
  static async getUserTeams(userId: string) {
    try {
      // Buscar associações de equipe do usuário
      const { data: memberships, error: membershipError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', userId);

      if (membershipError) {
        console.error('Erro ao buscar equipes do usuário:', membershipError);
        throw new Error(membershipError.message);
      }

      // Buscar as equipes completas
      if (memberships && memberships.length > 0) {
        const teamIds = memberships.map(m => m.team_id);
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .in('id', teamIds);
          
        if (teamsError) {
          throw teamsError;
        }
        
        return {
          memberships: memberships || [],
          teams: teams || []
        };
      }

      return {
        memberships: memberships || [],
        teams: []
      };
    } catch (error: any) {
      console.error('Erro ao buscar equipes do usuário:', error);
      throw error;
    }
  }

  /**
   * Obtém os membros de uma equipe
   * @param teamId ID da equipe
   * @returns Lista de membros da equipe
   */
  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      if (!teamId) {
        return [];
      }
      
      // Verificar se há dados em cache e se ainda são válidos
      const cachedData = cache.members.get(teamId);
      if (cachedData) {
        const now = Date.now();
        if (now - cachedData.timestamp < CACHE_EXPIRATION) {
          return cachedData.data;
        }
      }

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)

      if (error) {
        throw new Error(`Erro ao buscar membros da equipe: ${error.message}`);
      }
      
      const members = data || [];

      // Armazenar resultado em cache
      cache.members.set(teamId, {
        data: members as TeamMember[],
        timestamp: Date.now()
      });

      return members as TeamMember[];
    } catch (error: any) {    
      console.error('Erro ao buscar membros da equipe:', error);
      return [];
    }
  }

  /**
   * Gera uma mensagem de convite padrão
   * @param teamName Nome da equipe
   * @param fromEmail Email do remetente
   * @returns Mensagem de convite formatada
   */
  static generateInviteMessage(teamName: string, fromEmail: string): string {
    return `Olá! Estou convidando você para participar da equipe "${teamName}" no Radar21 (www.radar21.com.br) - uma plataforma para avaliação de competências de liderança na era da Indústria 4.0. Sua participação é muito importante para entendermos o perfil de nossa equipe. Por favor, aceite o convite e responda o questionário. Obrigado! - ${fromEmail}`;
  }

  /**
   * Atualiza o status de um membro da equipe
   * @param teamId ID da equipe
   * @param email Email do membro
   * @param status Novo status
   */
  static async updateMemberStatus(
    teamId: string,
    email: string,
    status: 'invited' | 'answered'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status })
        .eq('team_id', teamId)
        .eq('email', email);

      if (error) {
        throw new Error(`Erro ao atualizar status do membro: ${error.message}`);
      }

      // Invalidar cache de membros para esta equipe
      cache.members.delete(teamId);
    } catch (error: any) {
      console.error('Erro ao atualizar status do membro:', error);
      throw new Error(`Erro ao atualizar status do membro: ${error.message}`);
    }
  }

  /**
   * Obtém um membro específico da equipe
   * @param teamId ID da equipe
   * @param email Email do membro
   * @returns Dados do membro ou null se não encontrado
   */
  static async getTeamMember(teamId: string, email: string): Promise<TeamMember | null> {
    try {
      if (!teamId || !email) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Membro não encontrado
        }
        throw new Error(`Erro ao buscar membro da equipe: ${error.message}`);
      }
      
      return data as TeamMember;
    } catch (error: any) {    
      console.error('Erro ao buscar membro da equipe:', error);
      return null;
    }
  }
} 