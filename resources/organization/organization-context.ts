import { createContext } from "react";
import {
  Organization,
  OrganizationMember,
  OrganizationOpenAnswer,
  OrganizationState,
  OrganizationTeamOverview,
} from "./organization-model";

export const initialState: OrganizationState = {
  organizations: [],
  selectedOrganization: null,
  organizationMembers: [],
  teamOverviews: [],
  openAnswers: [],
  isLoading: false,
  error: null,
};

export interface OrganizationContextType extends OrganizationState {
  createOrganization: (name: string) => Promise<Organization | null>;
  getOrganizations: () => Promise<Organization[]>;
  getOrganization: (id: string) => Promise<Organization | null>;
  selectOrganization: (organization: Organization | null) => void;
  getOrganizationMembers: (
    organizationId: string
  ) => Promise<OrganizationMember[]>;
  inviteLeader: (
    organizationId: string,
    email: string
  ) => Promise<OrganizationMember | null>;
  removeMember: (memberId: string) => Promise<boolean>;
  getTeamOverviews: (
    organizationId: string
  ) => Promise<OrganizationTeamOverview[]>;
  getOpenAnswers: (
    organizationId: string,
    teamId?: string
  ) => Promise<OrganizationOpenAnswer[]>;
  addTeamToOrganization: (
    organizationId: string,
    teamId: string
  ) => Promise<boolean>;
  removeTeamFromOrganization: (
    organizationId: string,
    teamId: string
  ) => Promise<boolean>;
  clearError: () => void;
}

const OrganizationContext = createContext<OrganizationContextType>({
  ...initialState,
  createOrganization: async () => null,
  getOrganizations: async () => [],
  getOrganization: async () => null,
  selectOrganization: () => {},
  getOrganizationMembers: async () => [],
  inviteLeader: async () => null,
  removeMember: async () => false,
  getTeamOverviews: async () => [],
  getOpenAnswers: async () => [],
  addTeamToOrganization: async () => false,
  removeTeamFromOrganization: async () => false,
  clearError: () => {},
});

export default OrganizationContext;
