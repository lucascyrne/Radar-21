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
        .select('id')
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
        .single();

      if (error) {
        console.error('Erro ao criar equipe:', error);
        throw new Error(`Erro ao criar equipe: ${error.message}`);
      }

      // Invalidar cache de equipes para este usuário
      cache.teams.delete(ownerId);

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
    role: 'leader' | 'member',
    status: 'invited' | 'registered' | 'respondido'
  ): Promise<void> {
    try {
      // Se não foi fornecido um userId, tentar buscar pelo email
      if (!userId) {
        userId = await TeamService.getUserByEmail(email);
      }

      // Verificar se o membro já existe
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('email', email)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Erro ao verificar membro: ${checkError.message}`);
      }

      if (existingMember) {
        // Se o membro já existe, atualizar seu status e user_id (se disponível)
        const updateData: any = { status, role };
        if (userId && !existingMember.user_id) {
          updateData.user_id = userId;
        }

        const { error: updateError } = await supabase
          .from('team_members')
          .update(updateData)
          .eq('team_id', teamId)
          .eq('email', email);

        if (updateError) {
          throw new Error(`Erro ao atualizar membro: ${updateError.message}`);
        }
      } else {
        // Se o membro não existe, inserir novo registro
        const { error: insertError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: userId, // Pode ser null se o usuário ainda não existir
            email,
            role,
            status,
          });

        if (insertError) {
          throw new Error(`Erro ao adicionar membro: ${insertError.message}`);
        }
      }

      // Invalidar cache de membros para esta equipe
      cache.members.delete(teamId);
    } catch (error: any) {
      console.error('Erro ao adicionar membro à equipe:', error);
      throw new Error(`Erro ao adicionar membro à equipe: ${error.message}`);
    }
  }

  /**
   * Obtém as equipes do usuário
   * @param userId ID do usuário
   * @returns Lista de equipes e associações do usuário
   */
  static async getUserTeams(userId: string) {
    try {
      // Verificar se há dados em cache e se ainda são válidos
      const cachedData = cache.teams.get(userId);
      if (cachedData) {
        const now = Date.now();
        if (now - cachedData.timestamp < CACHE_EXPIRATION) {
          return cachedData.data;
        }
      }

      // Buscar equipes que o usuário é proprietário
      const { data: ownedTeams, error: ownedError } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', userId);

      if (ownedError) {
        throw new Error(`Erro ao buscar equipes próprias: ${ownedError.message}`);
      }

      // Buscar associações de equipe do usuário
      const { data: memberships, error: membershipError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', userId);

      if (membershipError) {
        throw new Error(`Erro ao buscar associações de equipe: ${membershipError.message}`);
      }

      // Buscar equipes das quais o usuário é membro
      const memberTeamIds = memberships.map(m => m.team_id);
      let memberTeams: any[] = [];

      if (memberTeamIds.length > 0) {
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .in('id', memberTeamIds);

        if (teamsError) {
          throw new Error(`Erro ao buscar equipes de membro: ${teamsError.message}`);
        }

        memberTeams = teams || [];
      }

      // Combinar equipes próprias e equipes de membro, removendo duplicatas
      const allTeams = [...ownedTeams];
      memberTeams.forEach(team => {
        if (!allTeams.some(t => t.id === team.id)) {
          allTeams.push(team);
        }
      });

      const result = { teams: allTeams, memberships };

      // Armazenar resultado em cache
      cache.teams.set(userId, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error: any) {
      console.error('Erro ao buscar equipes do usuário:', error);
      throw new Error(`Erro ao buscar equipes do usuário: ${error.message}`);
    }
  }

  /**
   * Obtém os membros de uma equipe
   * @param teamId ID da equipe
   * @returns Lista de membros da equipe
   */
  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
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
        .eq('team_id', teamId);

      if (error) {
        throw new Error(`Erro ao buscar membros da equipe: ${error.message}`);
      }

      // Armazenar resultado em cache
      cache.members.set(teamId, {
        data: data as TeamMember[],
        timestamp: Date.now()
      });

      return data as TeamMember[];
    } catch (error: any) {
      console.error('Erro ao buscar membros da equipe:', error);
      throw new Error(`Erro ao buscar membros da equipe: ${error.message}`);
    }
  }

  /**
   * Gera uma mensagem de convite padrão
   * @param teamName Nome da equipe
   * @param fromEmail Email do remetente
   * @returns Mensagem de convite formatada
   */
  static generateInviteMessage(teamName: string, fromEmail: string): string {
    return `Olá! Estou convidando você para participar da equipe "${teamName}" no Radar21 - uma plataforma para avaliação de competências de liderança na era da Indústria 4.0. Sua participação é muito importante para entendermos o perfil de nossa equipe. Por favor, aceite o convite e responda o questionário. Obrigado! - ${fromEmail}`;
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
    status: 'invited' | 'registered' | 'respondido'
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
} 