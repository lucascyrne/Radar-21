"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import OrganizationContext, { initialState } from "./organization-context";
import {
  Organization,
  OrganizationMember,
  OrganizationOpenAnswer,
  OrganizationState,
  OrganizationTeamOverview,
} from "./organization-model";
import { OrganizationService } from "./organization.service";

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider = ({
  children,
}: OrganizationProviderProps) => {
  const [state, setState] = useState<OrganizationState>(initialState);

  const updateState = useCallback((updates: Partial<OrganizationState>) => {
    setState((current) => ({ ...current, ...updates }));
  }, []);

  // Carregar organizações do usuário ao inicializar
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        updateState({ isLoading: true, error: null });
        const { data, error } = await OrganizationService.getMyOrganizations();

        if (error) {
          updateState({ error: error.message, isLoading: false });
          return;
        }

        updateState({
          organizations: data || [],
          isLoading: false,
        });
      } catch (error: any) {
        updateState({
          error: error.message || "Erro ao carregar organizações",
          isLoading: false,
        });
      }
    };

    loadOrganizations();
  }, [updateState]);

  // Criar uma nova organização
  const createOrganization = async (
    name: string
  ): Promise<Organization | null> => {
    try {
      updateState({ isLoading: true, error: null });
      const { data, error } = await OrganizationService.createOrganization(
        name
      );

      if (error) {
        updateState({ error: error.message, isLoading: false });
        return null;
      }

      // Adicionar à lista de organizações
      if (data) {
        updateState({
          organizations: [...state.organizations, data],
          selectedOrganization: data,
          isLoading: false,
        });
      }

      return data;
    } catch (error: any) {
      updateState({
        error: error.message || "Erro ao criar organização",
        isLoading: false,
      });
      return null;
    }
  };

  // Buscar todas as organizações do usuário
  const getOrganizations = async (): Promise<Organization[]> => {
    try {
      updateState({ isLoading: true, error: null });
      const { data, error } = await OrganizationService.getMyOrganizations();

      if (error) {
        updateState({ error: error.message, isLoading: false });
        return [];
      }

      updateState({
        organizations: data || [],
        isLoading: false,
      });

      return data || [];
    } catch (error: any) {
      updateState({
        error: error.message || "Erro ao carregar organizações",
        isLoading: false,
      });
      return [];
    }
  };

  // Buscar uma organização específica
  const getOrganization = async (id: string): Promise<Organization | null> => {
    try {
      updateState({ isLoading: true, error: null });
      const { data, error } = await OrganizationService.getOrganization(id);

      if (error) {
        updateState({ error: error.message, isLoading: false });
        return null;
      }

      if (data) {
        updateState({
          selectedOrganization: data,
          isLoading: false,
        });
      }

      return data;
    } catch (error: any) {
      updateState({
        error: error.message || "Erro ao carregar organização",
        isLoading: false,
      });
      return null;
    }
  };

  // Selecionar uma organização
  const selectOrganization = (organization: Organization | null) => {
    updateState({ selectedOrganization: organization });
  };

  // Buscar membros da organização
  const getOrganizationMembers = async (
    organizationId: string
  ): Promise<OrganizationMember[]> => {
    try {
      updateState({ isLoading: true, error: null });
      const { data, error } = await OrganizationService.getOrganizationMembers(
        organizationId
      );

      if (error) {
        updateState({ error: error.message, isLoading: false });
        return [];
      }

      updateState({
        organizationMembers: data || [],
        isLoading: false,
      });

      return data || [];
    } catch (error: any) {
      updateState({
        error: error.message || "Erro ao carregar membros",
        isLoading: false,
      });
      return [];
    }
  };

  // Convidar líder para a organização
  const inviteLeader = async (
    organizationId: string,
    email: string
  ): Promise<OrganizationMember | null> => {
    try {
      updateState({ isLoading: true, error: null });
      const { data, error } =
        await OrganizationService.inviteLeaderToOrganization(
          organizationId,
          email
        );

      if (error) {
        updateState({ error: error.message, isLoading: false });
        return null;
      }

      // Atualizar lista de membros se necessário
      if (data && state.organizationMembers.length > 0) {
        updateState({
          organizationMembers: [...state.organizationMembers, data],
          isLoading: false,
        });
      } else {
        updateState({ isLoading: false });
      }

      return data;
    } catch (error: any) {
      updateState({
        error: error.message || "Erro ao convidar líder",
        isLoading: false,
      });
      return null;
    }
  };

  // Remover membro da organização
  const removeMember = async (memberId: string): Promise<boolean> => {
    try {
      updateState({ isLoading: true, error: null });
      const { success, error } =
        await OrganizationService.removeOrganizationMember(memberId);

      if (error) {
        updateState({ error: error.message, isLoading: false });
        return false;
      }

      // Atualizar lista de membros
      if (success) {
        updateState({
          organizationMembers: state.organizationMembers.filter(
            (m) => m.id !== memberId
          ),
          isLoading: false,
        });
      }

      return success;
    } catch (error: any) {
      updateState({
        error: error.message || "Erro ao remover membro",
        isLoading: false,
      });
      return false;
    }
  };

  // Buscar visão geral das equipes
  const getTeamOverviews = async (
    organizationId: string
  ): Promise<OrganizationTeamOverview[]> => {
    try {
      updateState({ isLoading: true, error: null });
      const { data, error } = await OrganizationService.getTeamOverviews(
        organizationId
      );

      if (error) {
        updateState({ error: error.message, isLoading: false });
        return [];
      }

      updateState({
        teamOverviews: data || [],
        isLoading: false,
      });

      return data || [];
    } catch (error: any) {
      updateState({
        error: error.message || "Erro ao carregar visão geral das equipes",
        isLoading: false,
      });
      return [];
    }
  };

  // Buscar respostas às perguntas abertas
  const getOpenAnswers = async (
    organizationId: string,
    teamId?: string
  ): Promise<OrganizationOpenAnswer[]> => {
    try {
      updateState({ isLoading: true, error: null });
      const { data, error } = await OrganizationService.getOpenAnswers(
        organizationId,
        teamId
      );

      if (error) {
        updateState({ error: error.message, isLoading: false });
        return [];
      }

      updateState({
        openAnswers: data || [],
        isLoading: false,
      });

      return data || [];
    } catch (error: any) {
      updateState({
        error:
          error.message || "Erro ao carregar respostas às perguntas abertas",
        isLoading: false,
      });
      return [];
    }
  };

  // Adicionar equipe à organização
  const addTeamToOrganization = async (
    organizationId: string,
    teamId: string
  ): Promise<boolean> => {
    try {
      updateState({ isLoading: true, error: null });
      const { data, error } = await OrganizationService.addTeamToOrganization(
        organizationId,
        teamId
      );

      if (error) {
        updateState({ error: error.message, isLoading: false });
        return false;
      }

      updateState({ isLoading: false });
      return !!data;
    } catch (error: any) {
      updateState({
        error: error.message || "Erro ao adicionar equipe à organização",
        isLoading: false,
      });
      return false;
    }
  };

  // Remover equipe da organização
  const removeTeamFromOrganization = async (
    organizationId: string,
    teamId: string
  ): Promise<boolean> => {
    try {
      updateState({ isLoading: true, error: null });
      const { success, error } =
        await OrganizationService.removeTeamFromOrganization(
          organizationId,
          teamId
        );

      if (error) {
        updateState({ error: error.message, isLoading: false });
        return false;
      }

      // Atualizar lista de equipes se necessário
      if (success && state.teamOverviews.length > 0) {
        updateState({
          teamOverviews: state.teamOverviews.filter(
            (t) => t.team_id !== teamId
          ),
          isLoading: false,
        });
      } else {
        updateState({ isLoading: false });
      }

      return success;
    } catch (error: any) {
      updateState({
        error: error.message || "Erro ao remover equipe da organização",
        isLoading: false,
      });
      return false;
    }
  };

  // Limpar erro
  const clearError = () => {
    updateState({ error: null });
  };

  return (
    <OrganizationContext.Provider
      value={{
        ...state,
        createOrganization,
        getOrganizations,
        getOrganization,
        selectOrganization,
        getOrganizationMembers,
        inviteLeader,
        removeMember,
        getTeamOverviews,
        getOpenAnswers,
        addTeamToOrganization,
        removeTeamFromOrganization,
        clearError,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
