import { createContext } from 'react';
import { CreateTeamFormValues, Team, TeamState } from './team-model';

// Tipo do contexto de equipes
export interface TeamContextType extends TeamState {
    loadUserTeams: (userId: string) => Promise<void>;
    loadTeamMembers: (teamId: string) => Promise<void>;
    createTeam: (data: CreateTeamFormValues, userId: string, userEmail: string) => Promise<Team>;
    addTeamMember: (teamId: string, userId: string | null, email: string, role: 'leader' | 'member', status: 'invited' | 'registered' | 'respondido') => Promise<void>;
    selectTeam: (teamId: string) => void;
    generateInviteMessage: (teamName: string, fromEmail: string) => string;
    resetTeamsLoaded: () => void;
    resetMembersLoaded: (teamId: string) => void;
  }
  
  // Estado inicial do contexto de equipes
  export const initialTeamState: TeamState = {
    teams: [],
    selectedTeam: null,
    teamMembers: [],
    isLoading: false,
    error: null,
  };

export const TeamContext = createContext<TeamContextType>({
  ...initialTeamState,
  loadUserTeams: async () => {},
  loadTeamMembers: async () => {},
  createTeam: async () => ({ 
    id: '', 
    name: '', 
    owner_id: '', 
    owner_email: '', 
    team_size: 0, 
    created_at: '' 
  }),
  addTeamMember: async () => {},
  selectTeam: () => {},
  generateInviteMessage: () => '',
  resetTeamsLoaded: () => {},
  resetMembersLoaded: () => {},
}); 