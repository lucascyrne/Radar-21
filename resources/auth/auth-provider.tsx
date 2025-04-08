"use client";

import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { SurveyResponses } from "../survey/survey-model";
import AuthContext, { initialState } from "./auth-context";
import { AuthState, InviteUserParams, User } from "./auth-model";
import { AuthService, supabase } from "./auth.service";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>(initialState);
  const router = useRouter();

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((current) => ({ ...current, ...updates }));
  }, []);

  const handleAuthStateChange = useCallback(
    async (event: string, session: Session | null) => {
      console.log("Auth state changed:", event);

      if (!session?.user) {
        console.log("Sem sessão, limpando estado");
        updateState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      const user: User = {
        id: session.user.id,
        email: session.user.email || "",
        role: session.user.user_metadata?.role || "COLLABORATOR",
        email_confirmed_at: session.user.email_confirmed_at,
      };

      const isEmailConfirmed = !!session.user.email_confirmed_at;

      console.log("Atualizando estado com:", {
        isEmailConfirmed,
        user: user.email,
        event,
      });

      updateState({
        user,
        session,
        isAuthenticated: isEmailConfirmed,
        isLoading: false,
      });

      // Redirecionar apenas em eventos específicos
      if (["SIGNED_IN", "INITIAL_SESSION"].includes(event)) {
        console.log("Evento de autenticação detectado:", event);
        if (isEmailConfirmed) {
          console.log("Email confirmado, redirecionando para /team-setup");
          await router.push("/team-setup");
        } else {
          console.log("Email não confirmado, redirecionando para verificação");
          await router.push("/auth/verify-email");
        }
      }
    },
    [router, updateState]
  );

  useEffect(() => {
    let mounted = true;
    console.log("Inicializando AuthProvider effect");

    const initialize = async () => {
      try {
        console.log("Inicializando AuthProvider");
        updateState({ isLoading: true });
        const session = await AuthService.getSession();

        if (mounted) {
          await handleAuthStateChange("INITIAL_SESSION", session);
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
        if (mounted) {
          updateState({ isLoading: false, error: "Erro na inicialização" });
        }
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        await handleAuthStateChange(event, session);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [handleAuthStateChange, updateState]);

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
      console.log("Iniciando login com email:", email);
      updateState({ isLoading: true, error: null });
      const { session } = await AuthService.signInWithEmail(email, password);

      if (!session) {
        throw new Error("Erro ao fazer login");
      }

      await handleAuthStateChange("SIGNED_IN", session);
    } catch (error: any) {
      console.error("Erro no login:", error);
      updateState({ error: error.message, isLoading: false });
      throw error;
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    role: string
  ) => {
    try {
      updateState({ isLoading: true, error: null });
      const { error: signUpError } = await AuthService.signUpWithEmail(
        email,
        password,
        role
      );

      if (signUpError) throw signUpError;

      updateState({ isLoading: false });
      router.push("/auth/verify-email");
    } catch (error: any) {
      updateState({ error: error.message, isLoading: false });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      updateState({ isLoading: true, error: null });
      await AuthService.signOut();
      updateState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
      router.push("/auth");
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
        setSurveyResponses: (surveyResponses: SurveyResponses | null) =>
          updateState({ surveyResponses }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
