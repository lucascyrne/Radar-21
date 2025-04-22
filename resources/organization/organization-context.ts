import { createContext } from "react";
import {
  Organization,
  OrganizationOpenAnswer,
  OrganizationState,
  OrganizationTeamOverview,
} from "./organization-model";

export const initialState: OrganizationState = {
  organizations: [],
  selectedOrganization: null,
  teamOverviews: [],
  openAnswers: [],
  isLoading: false,
  error: null,
};

export interface OrganizationContextType extends OrganizationState {
  selectOrganization: (organization: Organization | null) => void;
  getTeamOverviews: (
    organizationId: string
  ) => Promise<OrganizationTeamOverview[]>;
  getOpenAnswers: (
    organizationId: string,
    teamId?: string
  ) => Promise<OrganizationOpenAnswer[]>;
  clearError: () => void;
}

const OrganizationContext = createContext<OrganizationContextType>({
  ...initialState,
  selectOrganization: () => {},
  getTeamOverviews: async () => [],
  getOpenAnswers: async () => [],
  clearError: () => {},
});

export default OrganizationContext;
