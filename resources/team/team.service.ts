import { supabase } from '@/resources/auth/auth.service';
import { Team, TeamMember } from './team-model';

export const TeamService = {
  // Criar uma nova equipe
  createTeam: async (name: string, ownerId: string, ownerEmail: string, teamSize: number): Promise<Team> => {
    const { data, error } = await supabase
      .from('teams')
      .insert([
        { name, owner_id: ownerId, owner_email: ownerEmail, team_size: teamSize }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Adicionar membro à equipe (o próprio criador como líder)
  addTeamMember: async (teamId: string, userId: string, email: string, role: 'leader' | 'member', status: 'invited' | 'registered' | 'completed'): Promise<TeamMember> => {
    const { data, error } = await supabase
      .from('team_members')
      .insert([
        { team_id: teamId, user_id: userId, email, role, status }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Verificar se uma equipe existe pelo nome e email do proprietário
  findTeamByNameAndOwner: async (name: string, ownerEmail: string): Promise<Team | null> => {
    const { data, error } = await supabase
      .from('teams')
      .select()
      .eq('name', name)
      .eq('owner_email', ownerEmail)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Não encontrado
      throw error;
    }
    return data;
  },

  // Entrar em uma equipe existente
  joinTeam: async (teamId: string, userId: string, email: string): Promise<TeamMember> => {
    // Verificar se o usuário já é membro da equipe
    const { data: existingMember } = await supabase
      .from('team_members')
      .select()
      .eq('team_id', teamId)
      .eq('email', email)
      .single();
    
    if (existingMember) {
      // Atualizar o status se já estiver convidado
      if (existingMember.status === 'invited') {
        const { data, error } = await supabase
          .from('team_members')
          .update({ user_id: userId, status: 'registered' })
          .eq('id', existingMember.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
      return existingMember;
    }
    
    // Adicionar como novo membro
    return await TeamService.addTeamMember(teamId, userId, email, 'member', 'registered');
  },

  // Obter equipes do usuário
  getUserTeams: async (userId: string): Promise<{ teams: Team[], memberships: TeamMember[] }> => {
    // Buscar membros da equipe
    const { data: memberships, error: memberError } = await supabase
      .from('team_members')
      .select()
      .eq('user_id', userId);
    
    if (memberError) throw memberError;
    
    if (!memberships || memberships.length === 0) {
      return { teams: [], memberships: [] };
    }
    
    // Buscar detalhes das equipes
    const teamIds = memberships.map(m => m.team_id);
    const { data: teams, error: teamError } = await supabase
      .from('teams')
      .select()
      .in('id', teamIds);
    
    if (teamError) throw teamError;
    
    return { teams: teams || [], memberships: memberships };
  },

  // Obter membros de uma equipe
  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    const { data, error } = await supabase
      .from('team_members')
      .select()
      .eq('team_id', teamId);
    
    if (error) throw error;
    return data || [];
  },

  // Gerar mensagem de convite
  generateInviteMessage: (teamName: string, ownerEmail: string): string => {
    return `Oi. Tudo bem? Favor preencher essa ferramenta para que possamos saber como nossa equipe está em relação às competências de liderança 4.0. Lembre de selecionar "Entrar em Equipe" na página de equipe e inserir o meu email ${ownerEmail} e o nome da equipe ${teamName}`;
  }
}; 