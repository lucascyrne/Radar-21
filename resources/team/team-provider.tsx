"use client";

import { ReactNode, useCallback, useState, useRef, useEffect } from 'react';
import { initialTeamState, TeamContext } from './team-context';
import { TeamService } from './team.service';
import { CreateTeamFormValues, TeamMember, TeamMemberStatus, Team, TeamResponse, MemberTeamResponse } from './team-model';
import { useAuth } from '../auth/auth-hook';
import { useInvite } from '../invite/invite-hook';
import { supabase } from '../auth/auth.service';

interface TeamProviderProps {
  children: ReactNode;
}

interface DBTeam {
  id: string;
  name: string;
  creator_email: string;
  team_size: number;
  created_at: string;
}

interface DBTeamMember {
  id: string;
  team_id: string;
  teams: DBTeam;
}

export function TeamProvider({ children }: TeamProviderProps) {
  const [state, setState] = useState(initialTeamState);
  const { user } = useAuth();
  const { pendingInviteId, processInvite } = useInvite();
  
  // Refs para controlar requisições em andamento
  const loadingTeamsRef = useRef(false);
  const loadingMembersRef = useRef(false);
  const loadedMembersRef = useRef<Set<string>>(new Set());

  // Carregar membros da equipe
  const loadTeamMembers = useCallback(async (teamId: string) => {
    if (!teamId || loadingMembersRef.current) return;
    
    loadingMembersRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const members = await TeamService.getTeamMembers(teamId);
      
      // Atualizar o estado com os membros
      setState(prev => ({ ...prev, teamMembers: members, isLoading: false }));
      
      // Se o usuário atual estiver logado, encontrar e definir o membro atual
      if (user?.email) {
        const currentMember = members.find(m => m.email === user.email) || null;
        setState(prev => ({ ...prev, currentMember }));
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Erro ao carregar membros da equipe' 
      }));
    } finally {
      loadingMembersRef.current = false;
    }
  }, [user?.email]);

  // Carregar equipes do usuário
  const loadTeams = useCallback(async () => {
    if (!user?.email) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      type SupabaseTeamMember = {
        id: string;
        team_id: string;
        teams: DBTeam;
      };
      
      // Buscar todos os times onde o usuário é membro
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          teams:team_id (
            id,
            name,
            owner_email,
            team_size,
            created_at
          )
        `)
        .eq('email', user.email)
        .returns<SupabaseTeamMember[]>();

      if (memberError) throw memberError;

      if (!memberData) {
        setState(prev => ({
          ...prev,
          teams: [],
          selectedTeam: null,
          teamMembers: [],
          isLoading: false,
          error: null,
          isInitialLoading: false
        }));
        return;
      }

      // Extrair e formatar times únicos
      const uniqueTeams = Array.from(
        new Map(
          memberData
            .filter(mt => mt.teams)
            .map(mt => {
              const team = mt.teams;
              return [
                team.id,
                {
                  id: team.id,
                  name: team.name,
                  owner_id: '', // Campo não usado mais
                  owner_email: team.creator_email,
                  team_size: team.team_size,
                  created_at: team.created_at
                } as Team
              ] as const;
            })
        ).values()
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Buscar membros de todas as equipes
      const teamIds = uniqueTeams.map(team => team.id);
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .in('team_id', teamIds)
        .returns<TeamMember[]>();

      if (membersError) throw membersError;

      // Atualizar estado com dados frescos
      setState(prev => ({
        ...prev,
        teams: uniqueTeams,
        selectedTeam: prev.selectedTeam || uniqueTeams[0] || null,
        teamMembers: members || [],
        isLoading: false,
        error: null,
        isInitialLoading: false
      }));

      // Se temos uma equipe selecionada, carregar seus membros
      if (uniqueTeams[0]?.id) {
        await loadTeamMembers(uniqueTeams[0].id);
      }

    } catch (error: any) {
      console.error('Erro ao carregar equipes:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
        isInitialLoading: false
      }));
    } finally {
      loadingTeamsRef.current = false;
    }
  }, [user?.email, loadTeamMembers]);

  // Efeito para carregar equipes automaticamente quando o usuário está autenticado
  useEffect(() => {
    const autoLoadTeams = async () => {
      if (user?.id && !loadingTeamsRef.current) {
        loadingTeamsRef.current = true;
        await loadTeams();
      }
    };
    
    autoLoadTeams();
  }, [user?.id]);

  // Efeito para carregar o membro atual quando o usuário ou a equipe selecionada mudar
  useEffect(() => {
    const loadCurrentMember = async () => {
      if (user?.email && state.selectedTeam) {
        const currentMember = await getCurrentMember(state.selectedTeam.id, user.email);
        if (currentMember) {
          setState(prev => ({ ...prev, currentMember }));
        }
      }
    };

    loadCurrentMember();
  }, [user?.email, state.selectedTeam?.id]);

  // Efeito para ouvir atualizações de equipe
  useEffect(() => {
    const handleTeamUpdate = async (event: Event) => {
      if (user?.id) {
        const customEvent = event as CustomEvent<{ teamId: string }>;
        // Limpar o cache de equipes carregadas
        loadingTeamsRef.current = false;
        loadedMembersRef.current.clear();
        
        // Recarregar equipes do usuário
        await loadTeams();
        
        // Se recebeu um teamId específico, carregar seus membros
        if (customEvent.detail?.teamId) {
          await loadTeamMembers(customEvent.detail.teamId);
        }
      }
    };

    window.addEventListener('teamUpdate', handleTeamUpdate);
    return () => {
      window.removeEventListener('teamUpdate', handleTeamUpdate);
    };
  }, [user?.id]);

  // Obter o membro atual
  const getCurrentMember = useCallback(async (teamId: string, userEmail: string): Promise<TeamMember | null> => {
    if (!teamId || !userEmail) return null;
    
    try {
      // Primeiro, verificar se já temos o membro no estado
      const memberInState = state.teamMembers.find(m => m.email === userEmail && m.team_id === teamId);
      if (memberInState) return memberInState;
      
      // Se não, buscar do servidor
      const member = await TeamService.getTeamMember(teamId, userEmail);
      
      // Atualizar o estado se encontrou o membro
      if (member) {
        setState(prev => ({ ...prev, currentMember: member }));
      }
      
      return member;
    } catch (error) {
      console.error('Erro ao obter membro atual:', error);
      return null;
    }
  }, [state.teamMembers]);

  // Criar uma nova equipe
  const createTeam = useCallback(async (
    data: CreateTeamFormValues, 
    userId: string, 
    userEmail: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const team = await TeamService.createTeam(
        data.name,
        userId,
        userEmail,
        data.team_size
      );

      // O criador da equipe começa como "invited" (não "answered")
      await TeamService.addTeamMember(
        team.id,
        userId,
        userEmail,
        data.role as 'leader' | 'member',
        'invited'
      );
      
      setState(prev => ({ 
        ...prev, 
        teams: [...prev.teams, team],
        selectedTeam: team,
        isLoading: false 
      }));
      
      // Carregar membros da nova equipe
      loadTeamMembers(team.id);
      
      return team;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Erro ao criar equipe' 
      }));
      throw error;
    }
  }, []);

  // Adicionar membro à equipe
  const addTeamMember = useCallback(async (
    teamId: string,
    userId: string | null,
    email: string,
    role: 'leader' | 'member',
    status: TeamMemberStatus
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Membros convidados sempre começam com status "invited"
      const memberStatus = userId ? status : 'invited';
      
      await TeamService.addTeamMember(teamId, userId, email, role, memberStatus);
      
      // Forçar recarregamento dos membros
      loadedMembersRef.current.delete(teamId);
      await loadTeamMembers(teamId);
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Erro ao adicionar membro à equipe' 
      }));
      throw error;
    }
  }, []);

  // Selecionar uma equipe
  const selectTeam = useCallback((teamId: string) => {
    const team = state.teams.find(t => t.id === teamId);
    if (team && team.id !== state.selectedTeam?.id) {
      setState(prev => ({ ...prev, selectedTeam: team }));
      loadTeamMembers(team.id);
    }
  }, [state.teams, state.selectedTeam?.id]);

  // Atualizar status do membro
  const updateMemberStatus = useCallback(async (
    teamId: string,
    email: string,
    status: TeamMemberStatus
  ) => {
    try {
      await TeamService.updateMemberStatus(teamId, email, status);
      
      // Atualizar o estado local
      setState(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.map(member => 
          member.team_id === teamId && member.email === email
            ? { ...member, status }
            : member
        ),
        currentMember: prev.currentMember && prev.currentMember.team_id === teamId && prev.currentMember.email === email
          ? { ...prev.currentMember, status }
          : prev.currentMember
      }));
      
      // Forçar recarregamento dos membros
      loadedMembersRef.current.delete(teamId);
    } catch (error) {
      console.error('Erro ao atualizar status do membro:', error);
      throw error;
    }
  }, []);

  // Gerar mensagem de convite
  const generateInviteMessage = useCallback((teamName: string, fromEmail: string) => {
    return TeamService.generateInviteMessage(teamName, fromEmail);
  }, []);

  // Resetar estado de carregamento de equipes
  const resetTeamsLoaded = useCallback(() => {
    loadingTeamsRef.current = false;
    setState(prev => ({ ...prev, isInitialLoading: true }));
  }, []);

  // Resetar estado de carregamento de membros
  const resetMembersLoaded = useCallback((teamId: string) => {
    if (teamId) {
      loadedMembersRef.current.delete(teamId);
    }
    loadingMembersRef.current = false;
  }, []);

  const refreshTeams = useCallback(async () => {
    if (!user?.id) return;
    
    // Limpar cache e estado
    loadingTeamsRef.current = false;
    loadedMembersRef.current.clear();
    setState(prev => ({ 
      ...prev, 
      teams: [],
      selectedTeam: null,
      teamMembers: [],
      currentMember: null,
      isLoading: true, 
      error: null 
    }));
    
    try {
      const { teams: userTeams } = await TeamService.getUserTeams(user.id);
      console.log('Times atualizados:', userTeams);

      // Se houver times, carregar os membros do primeiro time
      if (userTeams.length > 0) {
        console.log('Carregando membros do time:', userTeams[0].id);
        const members = await TeamService.getTeamMembers(userTeams[0].id);
        
        setState(prev => ({
          ...prev,
          teams: userTeams,
          selectedTeam: userTeams[0],
          teamMembers: members,
          isLoading: false,
          isInitialLoading: false
        }));

        // Marcar o time como carregado
        loadedMembersRef.current.add(userTeams[0].id);

        // Se o usuário atual estiver logado, encontrar e definir o membro atual
        if (user?.email) {
          const currentMember = members.find(m => m.email === user.email) || null;
          setState(prev => ({ ...prev, currentMember }));
        }
      } else {
        setState(prev => ({
          ...prev,
          teams: userTeams,
          selectedTeam: null,
          teamMembers: [],
          currentMember: null,
          isLoading: false,
          isInitialLoading: false
        }));
      }
    } catch (err) {
      console.error('Erro ao atualizar times:', err);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Erro ao carregar times e membros' 
      }));
    }
  }, [user?.id, user?.email]);

  // Processar convite pendente quando o usuário estiver disponível
  useEffect(() => {
    const handleInvite = async () => {
      if (user?.id && user?.email && pendingInviteId) {
        try {
          console.log('Processando convite pendente para usuário:', user.email);
          await processInvite(user.id, user.email, pendingInviteId);
          
          // Forçar limpeza do cache e recarregamento completo
          loadingTeamsRef.current = false;
          loadedMembersRef.current.clear();
          
          console.log('Convite processado com sucesso, atualizando times e membros...');
          
          // Recarregar times e forçar atualização do estado
          await refreshTeams();
          
          // Disparar evento de atualização após recarregar
          window.dispatchEvent(new CustomEvent('teamUpdate', { 
            detail: { teamId: pendingInviteId } 
          }));
        } catch (error) {
          console.error('Erro ao processar convite:', error);
        }
      }
    };

    handleInvite();
  }, [user?.id, user?.email, pendingInviteId, processInvite, refreshTeams]);

  // Efeito adicional para garantir atualização após processamento do convite
  useEffect(() => {
    if (state.teams.length > 0 && user?.email) {
      const team = state.teams[0];
      loadTeamMembers(team.id);
    }
  }, [state.teams, user?.email, loadTeamMembers]);

  return (
    <TeamContext.Provider
      value={{
        ...state,
        loadTeams,
        loadTeamMembers,
        getCurrentMember,
        createTeam,
        addTeamMember,
        selectTeam,
        generateInviteMessage,
        updateMemberStatus,
        resetTeamsLoaded,
        resetMembersLoaded,
        refreshTeams,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
} 