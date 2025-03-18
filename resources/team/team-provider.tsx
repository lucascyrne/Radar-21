"use client";

import { ReactNode, useCallback, useState, useRef, useEffect } from 'react';
import { initialTeamState, TeamContext } from './team-context';
import { TeamService } from './team.service';
import { CreateTeamFormValues, Team, TeamMember, TeamMemberStatus } from './team-model';
import { useAuth } from '../auth/auth-hook';
import { useInvite } from '../invite/invite-hook';

interface TeamProviderProps {
  children: ReactNode;
}

export function TeamProvider({ children }: TeamProviderProps) {
  const [state, setState] = useState(initialTeamState);
  const { user } = useAuth();
  const { pendingInvite, processPendingInvite } = useInvite();
  
  // Refs para controlar requisições em andamento
  const loadingTeamsRef = useRef(false);
  const loadingMembersRef = useRef(false);
  const loadedMembersRef = useRef<Set<string>>(new Set());

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

  // Efeito para carregar equipes automaticamente quando o usuário está autenticado
  useEffect(() => {
    const autoLoadTeams = async () => {
      if (user?.id && !loadingTeamsRef.current && state.teams.length === 0) {
        console.log('Carregando equipes automaticamente para o usuário:', user.id);
        await loadUserTeams(user.id);
      }
    };
    
    autoLoadTeams();
  }, [user?.id]);

  // Carregar equipes do usuário
  const loadUserTeams = useCallback(async (userId: string) => {
    if (!userId || loadingTeamsRef.current || state.teams.length > 0) return;
    
    loadingTeamsRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { teams } = await TeamService.getUserTeams(userId);
      const safeTeams = Array.isArray(teams) ? teams : [];
      
      setState(prev => ({ 
        ...prev, 
        teams: safeTeams,
        selectedTeam: safeTeams[0] || null,
        isLoading: false,
        isInitialLoading: false
      }));

      // Se tiver uma equipe selecionada, carregar seus membros
      if (safeTeams[0]?.id) {
        loadTeamMembers(safeTeams[0].id);
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        isInitialLoading: false,
        error: error.message || 'Erro ao carregar equipes' 
      }));
    } finally {
      loadingTeamsRef.current = false;
    }
  }, []);

  // Carregar membros da equipe
  const loadTeamMembers = useCallback(async (teamId: string) => {
    if (!teamId || loadingMembersRef.current) return;
    
    // Verificar se já carregou esta equipe
    if (loadedMembersRef.current.has(teamId)) return;
    
    loadingMembersRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const members = await TeamService.getTeamMembers(teamId);
      
      // Atualizar o estado com os membros
      setState(prev => ({ ...prev, teamMembers: members, isLoading: false }));
      
      // Marcar esta equipe como carregada
      loadedMembersRef.current.add(teamId);
      
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
  }, [state.teams, state.selectedTeam?.id, loadTeamMembers]);

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
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
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
    const processInvite = async () => {
      if (user?.id && user?.email && pendingInvite) {
        try {
          console.log('Processando convite pendente para usuário:', user.email);
          await processPendingInvite(user.id, user.email);
          console.log('Convite processado com sucesso, atualizando times e membros...');
          await refreshTeams();
        } catch (error) {
          console.error('Erro ao processar convite:', error);
        }
      }
    };

    processInvite();
  }, [user?.id, user?.email, pendingInvite, processPendingInvite, refreshTeams]);

  return (
    <TeamContext.Provider
      value={{
        ...state,
        loadUserTeams,
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