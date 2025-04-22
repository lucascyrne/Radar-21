"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/auth-hook";
import OrganizationContext, { initialState } from "./organization-context";
import {
  Organization,
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
  const { user } = useAuth();

  const updateState = useCallback((updates: Partial<OrganizationState>) => {
    setState((current) => ({ ...current, ...updates }));
  }, []);

  // Inicializar a organização com base no usuário atual
  useEffect(() => {
    if (user?.role === "ORGANIZATION") {
      // Se o usuário for uma organização, usá-lo como organização selecionada
      const userOrg: Organization = {
        id: user.id,
        name: user.name || user.email || "Minha Organização",
        owner_id: user.id,
        created_at: user.email_confirmed_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      updateState({
        organizations: [userOrg],
        selectedOrganization: userOrg,
        isLoading: false,
      });
    }
  }, [user, updateState]);

  // Selecionar uma organização
  const selectOrganization = (organization: Organization | null) => {
    updateState({ selectedOrganization: organization });
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

  // Limpar erro
  const clearError = () => {
    updateState({ error: null });
  };

  return (
    <OrganizationContext.Provider
      value={{
        ...state,
        selectOrganization,
        getTeamOverviews,
        getOpenAnswers,
        clearError,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
