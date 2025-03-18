import { createContext } from 'react';
import { CreateTeamFormValues, Team, TeamState, TeamMember, TeamMemberStatus } from './team-model';

// Tipo do contexto de equipes
export interface TeamContextType extends TeamState {
  loadUserTeams: (userId: string) => Promise<void>;
  loadTeamMembers: (teamId: string) => Promise<void>;
  getCurrentMember: (teamId: string, userEmail: string) => Promise<TeamMember | null>;
  createTeam: (data: CreateTeamFormValues, userId: string, userEmail: string) => Promise<Team>;
  addTeamMember: (teamId: string, userId: string | null, email: string, role: 'leader' | 'member', status: TeamMemberStatus) => Promise<void>;
  selectTeam: (teamId: string) => void;
  generateInviteMessage: (teamName: string, fromEmail: string) => string;
  updateMemberStatus: (teamId: string, email: string, status: TeamMemberStatus) => Promise<void>;
  resetTeamsLoaded: () => void;
  resetMembersLoaded: (teamId: string) => void;
  refreshTeams: () => Promise<void>;
}

// Estado inicial do contexto de equipes
export const initialTeamState: TeamState = {
  teams: [],
  selectedTeam: null,
  teamMembers: [],
  currentMember: null,
  isLoading: false,
  error: null,
};

export const TeamContext = createContext<TeamContextType>({
  ...initialTeamState,
  loadUserTeams: async () => {},
  loadTeamMembers: async () => {},
  getCurrentMember: async () => null,
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
  updateMemberStatus: async () => {},
  resetTeamsLoaded: () => {},
  resetMembersLoaded: () => {},
  refreshTeams: async () => {},
}); 