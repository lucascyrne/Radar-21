"use client";

import supabase from "@/lib/supabase/client";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/auth-hook";
import { useInvite } from "../invite/invite-hook";
import { initialTeamState, TeamContext } from "./team-context";
import {
  CreateTeamFormValues,
  TeamMember,
  TeamMemberStatus,
} from "./team-model";
import { TeamService } from "./team.service";

interface UserProfile {
  id: string;
  role: string;
  auth_id: string;
}

interface TeamProviderProps {
  children: ReactNode;
}
export function TeamProvider({ children }: TeamProviderProps) {
  const [state, setState] = useState(initialTeamState);
  const { user } = useAuth();
  const { pendingInviteId, processInvite } = useInvite();

  // Adicionar estado para controlar se estamos no lado do cliente
  const [isClient, setIsClient] = useState(false);

  // Refs para controlar requisições em andamento
  const loadingTeamsRef = useRef(false);
  const loadingMembersRef = useRef(false);
  const loadedMembersRef = useRef<Set<string>>(new Set());
  const initialLoadAttempted = useRef(false);
  const teamsLoadedRef = useRef(false);

  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true);
    // Armazenar o documento visível atual
    const handleVisibilityChange = () => {
      // Não recarregar quando a página volta a ficar visível
      // Isso evita problemas de alt+tab
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Limpar estado do provider
  const clearState = useCallback(() => {
    setState(initialTeamState);
    loadingTeamsRef.current = false;
    loadingMembersRef.current = false;
    loadedMembersRef.current.clear();
    initialLoadAttempted.current = false;
    teamsLoadedRef.current = false;
  }, []);

  // Carregar membros da equipe
  const loadTeamMembers = useCallback(
    async (teamId: string) => {
      if (!teamId || loadingMembersRef.current) return;

      loadingMembersRef.current = true;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const members = await TeamService.getTeamMembers(teamId);

        // Atualizar o estado com os membros
        setState((prev) => ({
          ...prev,
          teamMembers: members,
          isLoading: false,
        }));

        // Se o usuário atual estiver logado, encontrar e definir o membro atual
        if (user?.email) {
          const currentMember =
            members.find((m) => m.email === user.email) || null;
          setState((prev) => ({ ...prev, currentMember }));
        }
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Erro ao carregar membros da equipe",
        }));
      } finally {
        loadingMembersRef.current = false;
      }
    },
    [user?.email]
  );

  // Carregar equipes do usuário
  const loadTeams = useCallback(
    async (userId: string) => {
      if (!userId || loadingTeamsRef.current || teamsLoadedRef.current) return;

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        loadingTeamsRef.current = true;

        console.log("Carregando equipes para usuário:", userId);

        const { teams: userTeams } = await TeamService.getUserTeams(userId);
        console.log("Times atualizados:", userTeams);

        // Se houver times, carregar os membros do primeiro time
        if (userTeams.length > 0) {
          console.log("Carregando membros do time:", userTeams[0].id);
          const members = await TeamService.getTeamMembers(userTeams[0].id);

          setState((prev) => ({
            ...prev,
            teams: userTeams,
            selectedTeam: userTeams[0],
            teamMembers: members,
            isLoading: false,
            isInitialLoading: false,
          }));

          // Marcar o time como carregado
          loadedMembersRef.current.add(userTeams[0].id);
          teamsLoadedRef.current = true;

          // Se o usuário atual estiver logado, encontrar e definir o membro atual
          if (user?.email) {
            const currentMember =
              members.find((m) => m.email === user.email) || null;
            setState((prev) => ({ ...prev, currentMember }));
          }
        } else {
          setState((prev) => ({
            ...prev,
            teams: userTeams,
            selectedTeam: null,
            teamMembers: [],
            currentMember: null,
            isLoading: false,
            isInitialLoading: false,
          }));
          teamsLoadedRef.current = true;
        }
      } catch (err) {
        console.error("Erro ao atualizar times:", err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Erro ao carregar times e membros",
        }));
      } finally {
        loadingTeamsRef.current = false;
      }
    },
    [user?.email]
  );

  // Modificar o efeito que tenta carregar as equipes automaticamente
  useEffect(() => {
    // Só tentar carregar se estamos no cliente e não foi carregado ainda
    if (isClient && user?.email && !teamsLoadedRef.current) {
      loadTeams(user.id);
    }
  }, [isClient, user?.email, user?.id, loadTeams]);

  // Efeito para limpar estado quando o usuário mudar
  useEffect(() => {
    if (!user) {
      clearState();
    }
  }, [user]);

  // Efeito para ouvir atualizações de equipe
  useEffect(() => {
    const handleTeamUpdate = async () => {
      if (user?.email) {
        teamsLoadedRef.current = false;
        await loadTeams(user.id);
      }
    };

    window.addEventListener("teamUpdate", handleTeamUpdate);
    return () => {
      window.removeEventListener("teamUpdate", handleTeamUpdate);
    };
  }, [user?.email, user?.id]);

  // Obter o membro atual
  const getCurrentMember = useCallback(
    async (teamId: string, userEmail: string): Promise<TeamMember | null> => {
      if (!teamId || !userEmail) return null;

      try {
        // Primeiro, verificar se já temos o membro no estado
        const memberInState = state.teamMembers.find(
          (m) => m.email === userEmail && m.team_id === teamId
        );
        if (memberInState) return memberInState;

        // Se não, buscar do servidor
        const member = await TeamService.getTeamMember(teamId, userEmail);

        // Atualizar o estado se encontrou o membro
        if (member) {
          setState((prev) => ({ ...prev, currentMember: member }));
        }

        return member;
      } catch (error) {
        console.error("Erro ao obter membro atual:", error);
        return null;
      }
    },
    [state.teamMembers]
  );

  // Criar uma nova equipe
  const createTeam = useCallback(
    async (data: CreateTeamFormValues, userId: string, userEmail: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Verificar o role do usuário
        const { data: userProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("auth_id", userId)
          .single();

        if (profileError) {
          throw new Error(
            `Erro ao verificar perfil do usuário: ${profileError.message}`
          );
        }

        const team = await TeamService.createTeam(
          data.name,
          userId,
          userEmail,
          data.team_size
        );

        // Apenas adicionar o usuário como membro se não for uma organização
        if (userProfile.role !== "ORGANIZATION") {
          await TeamService.addTeamMember(
            team.id,
            userId,
            userEmail,
            data.role as "leader" | "member",
            "invited"
          );
        }

        setState((prev) => ({
          ...prev,
          teams: [...prev.teams, team],
          selectedTeam: team,
          isLoading: false,
        }));

        // Carregar membros da nova equipe
        loadTeamMembers(team.id);

        // Marcar que os times foram carregados
        teamsLoadedRef.current = true;

        return team;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Erro ao criar equipe",
        }));
        throw error;
      }
    },
    []
  );

  // Adicionar membro à equipe
  const addTeamMember = useCallback(
    async (
      teamId: string,
      userId: string | null,
      email: string,
      role: "leader" | "member",
      status: TeamMemberStatus
    ) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Membros convidados sempre começam com status "invited"
        const memberStatus = userId ? status : "invited";

        await TeamService.addTeamMember(
          teamId,
          userId,
          email,
          role,
          memberStatus
        );

        // Forçar recarregamento dos membros
        loadedMembersRef.current.delete(teamId);
        await loadTeamMembers(teamId);

        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Erro ao adicionar membro à equipe",
        }));
        throw error;
      }
    },
    []
  );

  // Selecionar uma equipe
  const selectTeam = useCallback(
    (teamId: string) => {
      const team = state.teams.find((t) => t.id === teamId);
      setState((prev) => ({ ...prev, selectedTeam: team || null }));
      if (team) {
        loadTeamMembers(team.id);
      }
    },
    [state.teams]
  );

  // Atualizar status do membro
  const updateMemberStatus = useCallback(
    async (teamId: string, email: string, status: TeamMemberStatus) => {
      try {
        await TeamService.updateMemberStatus(teamId, email, status);

        // Atualizar o estado local
        setState((prev) => ({
          ...prev,
          teamMembers: prev.teamMembers.map((member) =>
            member.team_id === teamId && member.email === email
              ? { ...member, status }
              : member
          ),
          currentMember:
            prev.currentMember &&
            prev.currentMember.team_id === teamId &&
            prev.currentMember.email === email
              ? { ...prev.currentMember, status }
              : prev.currentMember,
        }));

        // Forçar recarregamento dos membros
        loadedMembersRef.current.delete(teamId);
      } catch (error) {
        console.error("Erro ao atualizar status do membro:", error);
        throw error;
      }
    },
    []
  );

  // Gerar mensagem de convite
  const generateInviteMessage = useCallback(
    (teamName: string, fromEmail: string) => {
      return TeamService.generateInviteMessage(teamName, fromEmail);
    },
    []
  );

  // Resetar estado de carregamento de equipes
  const resetTeamsLoaded = useCallback(() => {
    loadingTeamsRef.current = false;
    teamsLoadedRef.current = false;
    setState((prev) => ({ ...prev, isInitialLoading: true }));
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
    teamsLoadedRef.current = false;
    loadedMembersRef.current.clear();
    setState((prev) => ({
      ...prev,
      teams: [],
      selectedTeam: null,
      teamMembers: [],
      currentMember: null,
      isLoading: true,
      error: null,
    }));

    try {
      const { teams: userTeams } = await TeamService.getUserTeams(user.id);
      console.log("Times atualizados:", userTeams);

      // Se houver times, carregar os membros do primeiro time
      if (userTeams.length > 0) {
        console.log("Carregando membros do time:", userTeams[0].id);
        const members = await TeamService.getTeamMembers(userTeams[0].id);

        setState((prev) => ({
          ...prev,
          teams: userTeams,
          selectedTeam: userTeams[0],
          teamMembers: members,
          isLoading: false,
          isInitialLoading: false,
        }));

        // Marcar o time como carregado
        loadedMembersRef.current.add(userTeams[0].id);
        teamsLoadedRef.current = true;

        // Se o usuário atual estiver logado, encontrar e definir o membro atual
        if (user?.email) {
          const currentMember =
            members.find((m) => m.email === user.email) || null;
          setState((prev) => ({ ...prev, currentMember }));
        }
      } else {
        setState((prev) => ({
          ...prev,
          teams: userTeams,
          selectedTeam: null,
          teamMembers: [],
          currentMember: null,
          isLoading: false,
          isInitialLoading: false,
        }));
        teamsLoadedRef.current = true;
      }
    } catch (err) {
      console.error("Erro ao atualizar times:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Erro ao carregar times e membros",
      }));
    }
  }, [user?.id, user?.email]);

  // Processar convite pendente quando o usuário estiver disponível
  useEffect(() => {
    if (!pendingInviteId) return;

    const handleInvite = async () => {
      if (user?.id && user?.email && pendingInviteId) {
        try {
          console.log("Processando convite pendente para usuário:", user.email);
          await processInvite(user.id, user.email, pendingInviteId);

          // Forçar limpeza do cache e recarregamento completo
          teamsLoadedRef.current = false;
          loadedMembersRef.current.clear();

          console.log(
            "Convite processado com sucesso, atualizando times e membros..."
          );

          // Recarregar times e forçar atualização do estado
          await refreshTeams();

          // Disparar evento de atualização após recarregar
          window.dispatchEvent(
            new CustomEvent("teamUpdate", {
              detail: { teamId: pendingInviteId },
            })
          );
        } catch (error) {
          console.error("Erro ao processar convite:", error);
        }
      }
    };

    handleInvite();
  }, [user?.id, user?.email, pendingInviteId]);

  // Carregar respostas da pesquisa da equipe
  const loadTeamSurveyResponses = useCallback(
    async (teamId: string) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));
        console.log(`Carregando respostas da pesquisa para equipe ${teamId}`);

        if (!teamId) {
          throw new Error("ID da equipe não fornecido");
        }

        // Primeiro carregar os membros da equipe para garantir que temos os papéis corretos
        if (loadedMembersRef.current.has(teamId) === false) {
          console.log("Carregando membros primeiro para obter os papéis");
          await loadTeamMembers(teamId);
          loadedMembersRef.current.add(teamId);
        }

        // Carregar as respostas da pesquisa
        const responses = await TeamService.getTeamSurveyResponses(teamId);

        console.log(
          `Obtidas ${responses.length} respostas para a equipe ${teamId}`
        );

        // Adicionar os papéis corretos às respostas usando os membros já carregados
        const responsesWithRoles = responses.map((response) => {
          // Tentar encontrar o papel do membro na lista de membros da equipe
          const member = state.teamMembers.find(
            (m) => m.user_id === response.user_id
          );

          if (member) {
            return {
              ...response,
              role: member.role, // Usar o papel do membro da lista
            };
          }
          return response;
        });

        // Log para debug dos papéis atribuídos
        console.log(
          "Papéis dos respondentes:",
          responsesWithRoles.map((r) => r.role)
        );

        setState((prev) => ({
          ...prev,
          teamSurveyResponses: responsesWithRoles,
          isLoading: false,
        }));

        return responsesWithRoles;
      } catch (error: any) {
        console.error("Erro ao carregar respostas da equipe:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Erro ao carregar respostas da equipe",
        }));
        return [];
      }
    },
    [state.teamMembers, loadTeamMembers]
  );

  return (
    <TeamContext.Provider
      value={{
        ...state,
        loadTeams,
        loadTeamMembers,
        loadTeamSurveyResponses,
        getCurrentMember,
        createTeam,
        addTeamMember,
        selectTeam,
        generateInviteMessage,
        updateMemberStatus,
        resetTeamsLoaded,
        resetMembersLoaded,
        refreshTeams,
        clearState,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}
