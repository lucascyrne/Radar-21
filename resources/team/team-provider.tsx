"use client";

import { ReactNode, useCallback, useState, useRef, useEffect } from 'react';
import { initialTeamState, TeamContext } from './team-context';
import { TeamService } from './team.service';
import { CreateTeamFormValues } from './team-model';
import { usePathname } from 'next/navigation';

interface TeamProviderProps {
  children: ReactNode;
}

// Lista de rotas que realmente precisam de dados de equipe
const TEAM_ROUTES = ['/team-setup', '/profile', '/survey', '/open-questions', '/results'];

export function TeamProvider({ children }: TeamProviderProps) {
  const [state, setState] = useState(initialTeamState);
  const pathname = usePathname();
  
  // Verificar se a rota atual precisa de dados de equipe
  const needsTeamData = TEAM_ROUTES.some(route => pathname?.startsWith(route));
  
  // Refs para controlar requisições em andamento
  const loadingTeamsRef = useRef(false);
  const loadingMembersRef = useRef<Record<string, boolean>>({});
  const teamsLoadedRef = useRef(false);
  const membersLoadedRef = useRef<Record<string, boolean>>({});

  // Carregar equipes do usuário
  const loadUserTeams = useCallback(async (userId: string) => {
    // Se não estiver em uma rota que precisa de dados de equipe, não fazer requisição
    if (!needsTeamData || !userId) return;
    
    // Evitar múltiplas requisições simultâneas
    if (loadingTeamsRef.current || teamsLoadedRef.current) return;
    
    loadingTeamsRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { teams, memberships } = await TeamService.getUserTeams(userId);
      
      setState(prev => ({ 
        ...prev, 
        teams,
        isLoading: false,
        // Se já tiver uma equipe selecionada, manter. Caso contrário, selecionar a primeira
        selectedTeam: prev.selectedTeam || (teams.length > 0 ? teams[0] : null)
      }));
      
      // Se tiver uma equipe selecionada, carregar seus membros
      if (teams.length > 0 && !state.selectedTeam) {
        loadTeamMembers(teams[0].id);
      }
      
      // Marcar que as equipes foram carregadas
      teamsLoadedRef.current = true;
    } catch (error: any) {
      console.error('Erro ao carregar equipes:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Erro ao carregar equipes' 
      }));
    } finally {
      loadingTeamsRef.current = false;
    }
  }, [needsTeamData]);

  // Carregar membros da equipe
  const loadTeamMembers = useCallback(async (teamId: string) => {
    // Se não estiver em uma rota que precisa de dados de equipe, não fazer requisição
    if (!needsTeamData || !teamId) return;
    
    // Evitar múltiplas requisições simultâneas para a mesma equipe
    if (loadingMembersRef.current[teamId] || membersLoadedRef.current[teamId]) return;
    
    loadingMembersRef.current[teamId] = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const members = await TeamService.getTeamMembers(teamId);
      setState(prev => ({ ...prev, teamMembers: members, isLoading: false }));
      
      // Marcar que os membros desta equipe foram carregados
      membersLoadedRef.current[teamId] = true;
    } catch (error: any) {
      console.error('Erro ao carregar membros da equipe:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Erro ao carregar membros da equipe' 
      }));
    } finally {
      loadingMembersRef.current[teamId] = false;
    }
  }, [needsTeamData]);

  // Resetar os refs quando a rota mudar
  useEffect(() => {
    if (!needsTeamData) {
      // Se não estiver em uma rota que precisa de dados de equipe, limpar o estado
      teamsLoadedRef.current = false;
      membersLoadedRef.current = {};
    }
  }, [pathname, needsTeamData]);

  // Criar uma nova equipe
  const createTeam = useCallback(async (
    data: CreateTeamFormValues, 
    userId: string, 
    userEmail: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Criar a equipe
      const team = await TeamService.createTeam(
        data.name,
        userId,
        userEmail,
        data.team_size
      );
      
      // Adicionar o criador como membro/líder
      await TeamService.addTeamMember(
        team.id,
        userId,
        userEmail,
        data.role as 'leader' | 'member',
        'registered'
      );
      
      // Atualizar o estado
      setState(prev => ({ 
        ...prev, 
        teams: [...prev.teams, team],
        selectedTeam: team,
        isLoading: false 
      }));
      
      // Resetar os refs para permitir carregar membros da nova equipe
      membersLoadedRef.current[team.id] = false;
      
      // Carregar membros da nova equipe
      loadTeamMembers(team.id);
      
      return team;
    } catch (error: any) {
      console.error('Erro ao criar equipe:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Erro ao criar equipe' 
      }));
      throw error;
    }
  }, [loadTeamMembers]);

  // Adicionar membro à equipe
  const addTeamMember = useCallback(async (
    teamId: string,
    userId: string | null,
    email: string,
    role: 'leader' | 'member',
    status: 'invited' | 'registered' | 'respondido'
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await TeamService.addTeamMember(teamId, userId, email, role, status);
      
      // Resetar o ref para permitir carregar membros novamente
      membersLoadedRef.current[teamId] = false;
      
      // Recarregar membros da equipe
      await loadTeamMembers(teamId);
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error('Erro ao adicionar membro:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Erro ao adicionar membro à equipe' 
      }));
      throw error;
    }
  }, [loadTeamMembers]);

  // Selecionar uma equipe
  const selectTeam = useCallback((teamId: string) => {
    const team = state.teams.find(t => t.id === teamId);
    
    if (team) {
      setState(prev => ({ ...prev, selectedTeam: team }));
      
      // Carregar membros apenas se ainda não foram carregados
      if (!membersLoadedRef.current[teamId]) {
        loadTeamMembers(teamId);
      }
    }
  }, [state.teams, loadTeamMembers]);

  // Gerar mensagem de convite
  const generateInviteMessage = useCallback((teamName: string, fromEmail: string) => {
    return TeamService.generateInviteMessage(teamName, fromEmail);
  }, []);

  // Método para resetar o estado de carregamento de equipes
  const resetTeamsLoaded = useCallback(() => {
    teamsLoadedRef.current = false;
  }, []);

  // Método para resetar o estado de carregamento de membros de uma equipe
  const resetMembersLoaded = useCallback((teamId: string) => {
    if (teamId) {
      membersLoadedRef.current[teamId] = false;
    }
  }, []);

  return (
    <TeamContext.Provider
      value={{
        ...state,
        loadUserTeams,
        loadTeamMembers,
        createTeam,
        addTeamMember,
        selectTeam,
        generateInviteMessage,
        resetTeamsLoaded,
        resetMembersLoaded,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
} 