"use client";

import supabase from "@/lib/supabase/client";
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
    const initializeOrganization = async () => {
      if (!user?.id) return;

      try {
        // Buscar perfil do usuário
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (profile?.role === "ORGANIZATION") {
          // Se o usuário for uma organização, usá-lo como organização selecionada
          const userOrg: Organization = {
            id: profile.id, // Usar o ID do perfil
            name: user.user_metadata?.name || user.email || "Minha Organização",
            created_at:
              profile.created_at || user.created_at || new Date().toISOString(),
            updated_at: profile.updated_at || new Date().toISOString(),
          };

          updateState({
            organizations: [userOrg],
            selectedOrganization: userOrg,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Erro ao inicializar organização:", error);
        updateState({
          error: "Erro ao carregar organização",
          isLoading: false,
        });
      }
    };

    initializeOrganization();
  }, [user]);

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
