"use client";

import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { InviteService } from "../invite/invite.service";
import { SurveyResponses } from "../survey/survey-model";
import { TeamService } from "../team/team.service";
import AuthContext, { initialState } from "./auth-context";
import { AuthState, InviteUserParams, User } from "./auth-model";
import { AuthService, supabase } from "./auth.service";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>(initialState);
  const router = useRouter();

  const updateState = (updates: Partial<AuthState>) => {
    setState((current) => ({ ...current, ...updates }));
  };

  // Função para atualizar as respostas da pesquisa
  const setSurveyResponses = useCallback(
    (surveyResponses: SurveyResponses | null) => {
      updateState({ surveyResponses });
    },
    []
  );

  const updateStateWithSession = (session: Session | null) => {
    const user = session?.user
      ? {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
          team_id: session.user.user_metadata?.team_id,
          role: session.user.user_metadata?.role,
          status: session.user.user_metadata?.status,
          last_form_page: session.user.user_metadata?.last_form_page,
          has_completed_form: session.user.user_metadata?.has_completed_form,
        }
      : null;

    updateState({
      session,
      user,
      isAuthenticated: !!session,
      isLoading: false,
      error: null,
    });
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const session = await AuthService.getSession();
        if (mounted) {
          updateStateWithSession(session);

          if (session?.user) {
            await AuthService.processAuthenticatedUser(session.user);
          }
        }
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error);
        if (mounted) {
          updateState({
            isLoading: false,
            error: "Erro ao inicializar autenticação",
          });
        }
      }
    };

    initialize();

    const {
      data: { subscription },
    } = AuthService.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state changed:", event);

      switch (event) {
        case "SIGNED_IN":
          updateStateWithSession(session);
          if (session?.user) {
            await AuthService.processAuthenticatedUser(session.user);
            // Só redireciona para team-setup se o usuário estiver na página de autenticação
            if (window.location.pathname === "/auth") {
              router.push("/team-setup");
            }
          }
          break;
        case "SIGNED_OUT":
          updateStateWithSession(null);
          router.push("/auth");
          break;
        case "USER_UPDATED":
          updateStateWithSession(session);
          break;
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Auth Methods
  const signInWithGoogle = async () => {
    try {
      updateState({ isLoading: true, error: null });
      await AuthService.signInWithGoogle({
        redirectTo: `${window.location.origin}/auth/callback`,
      });
    } catch (error: any) {
      updateState({ error: error.message, isLoading: false });
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      updateState({ isLoading: true, error: null });
      const { user: supabaseUser } = await AuthService.signInWithEmail(
        email,
        password
      );

      if (supabaseUser) {
        // Converter o usuário do Supabase para nosso modelo User
        const user: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || email,
          created_at: supabaseUser.created_at,
          updated_at: supabaseUser.updated_at,
          ...supabaseUser.user_metadata,
        };

        // Processar convite pendente ao fazer login
        const inviteProcessed = await processInvite(user);

        updateState({
          user,
          isLoading: false,
          error: null,
        });

        // Redirecionar com base no processamento do convite
        if (inviteProcessed) {
          router.push("/team-setup");
        }
      }
    } catch (error: any) {
      updateState({ error: error.message, isLoading: false });
      throw error;
    }
  };

  const processInvite = async (user: User) => {
    try {
      if (!user.email) return false;

      // Verificar se já existe um teamId associado ao usuário
      if (user.team_id) {
        console.log("Usuário já possui uma equipe:", user.team_id);
        return false;
      }

      // Verificar se há um convite pendente antes de tentar processar
      const hasPendingInvite = await InviteService.checkPendingInvite(
        user.email
      );
      if (!hasPendingInvite) {
        console.log("Nenhum convite pendente encontrado para:", user.email);
        return false;
      }

      const teamId = await InviteService.processInvite(user.id, user.email);
      if (teamId) {
        // Atualizar o estado do usuário com a nova equipe
        const updatedUser = { ...user, team_id: teamId };
        updateState({ user: updatedUser });

        // Sincronizar associações de equipe
        await TeamService.syncUserTeamMemberships(user.id, user.email);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao processar convite:", error);
      // Não atualizar o estado com erro para não afetar a experiência do usuário
      return false;
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    role: string
  ) => {
    try {
      updateState({ isLoading: true, error: null });
      const { user: supabaseUser } = await AuthService.signUpWithEmail(
        email,
        password,
        role
      );

      if (supabaseUser) {
        // Converter o usuário do Supabase para nosso modelo User
        const user: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || email,
          created_at: supabaseUser.created_at,
          updated_at: supabaseUser.updated_at,
          ...supabaseUser.user_metadata,
        };

        // Processar convite pendente imediatamente após o registro
        const inviteProcessed = await processInvite(user);

        if (inviteProcessed) {
          // Atualizar estado com informações da equipe
          updateState({
            user,
            isLoading: false,
            error: null,
          });

          // Redirecionar para team-setup após processamento bem-sucedido
          router.push("/team-setup");
        }
      }
    } catch (error: any) {
      updateState({ error: error.message, isLoading: false });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      updateState({ isLoading: true, error: null });
      await AuthService.signOut();
      updateState({ user: null, session: null, isAuthenticated: false });
    } catch (error: any) {
      updateState({ error: error.message, isLoading: false });
    }
  };

  // User Management Methods
  const updateFormProgress = async (page: string, isComplete = false) => {
    try {
      if (!state.user) {
        return { success: false, error: "Usuário não autenticado" };
      }

      const { error } = await supabase
        .from("users")
        .update({
          last_form_page: page,
          has_completed_form: isComplete,
        })
        .eq("id", state.user.id);

      if (error) throw error;

      updateState({
        user: state.user
          ? {
              ...state.user,
              last_form_page: page,
              has_completed_form: isComplete,
            }
          : null,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const inviteUser = async (params: InviteUserParams) => {
    try {
      const response = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: params.email,
          inviteUrl: `${window.location.origin}/auth/accept-invite?team=${params.teamId}`,
          message: params.message,
          teamId: params.teamId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Utility Methods
  const getNextFormPage = () => {
    if (!state.user?.last_form_page) return "/form/step1";

    const formPages = [
      "/form/step1",
      "/form/step2",
      "/form/step3",
      "/form/step4",
      "/form/step5",
      "/resultados",
    ];

    const currentIndex = formPages.indexOf(state.user.last_form_page);
    return currentIndex === -1 || currentIndex === formPages.length - 1
      ? "/form/step1"
      : formPages[currentIndex + 1];
  };

  const hasCompletedForm = () => !!state.user?.has_completed_form;
  const clearError = () => updateState({ error: null });

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        clearError,
        inviteUser,
        updateFormProgress,
        getNextFormPage,
        hasCompletedForm,
        setUser: (user) => updateState({ user }),
        setSession: (session) => updateState({ session }),
        setIsLoading: (isLoading) => updateState({ isLoading }),
        setIsAuthenticated: (isAuthenticated) =>
          updateState({ isAuthenticated }),
        setError: (error) => updateState({ error }),
        setSurveyResponses,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
