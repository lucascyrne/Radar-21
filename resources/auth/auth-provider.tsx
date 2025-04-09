"use client";

import { Session } from "@supabase/supabase-js";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { SurveyResponses } from "../survey/survey-model";
import AuthContext, { initialState } from "./auth-context";
import { AuthState, UpdateProfileParams, User } from "./auth-model";
import { AuthService, supabase } from "./auth.service";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>(initialState);

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((current) => ({ ...current, ...updates }));
  }, []);

  const setSession = useCallback((session: Session | null) => {
    if (!session) {
      updateState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        surveyResponses: null,
      });
      return null;
    }

    const user: User = {
      id: session.user.id,
      email: session.user.email || "",
      role: session.user.user_metadata?.role || "COLLABORATOR",
      email_confirmed_at: session.user.email_confirmed_at,
    };

    updateState({
      user,
      session,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    return user;
  }, []);

  // Monitorar mudanças na autenticação
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        // Forçar limpeza completa do estado
        setState(initialState);
        // Limpar cookies e localStorage
        document.cookie.split(";").forEach(function (c) {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date().toUTCString() + ";path=/"
            );
        });
        localStorage.clear();
      } else {
        setSession(session);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      updateState({ isLoading: true, error: null });
      const { session } = await AuthService.signInWithEmail(email, password);

      if (!session) {
        throw new Error("Erro ao fazer login");
      }

      setSession(session);
      return session;
    } catch (error: any) {
      console.error("Erro no login:", error);
      updateState({ error: error.message, isLoading: false });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      updateState({ isLoading: true, error: null });
      await AuthService.signOut();
      setState(initialState);
    } catch (error: any) {
      updateState({ error: error.message, isLoading: false });
    }
  };

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
    } catch (error: any) {
      updateState({ error: error.message, isLoading: false });
      throw error;
    }
  };

  const updateProfile = async (params: UpdateProfileParams) => {
    try {
      updateState({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: params.name,
          avatar_url: params.avatar_url,
        },
      });

      if (error) throw error;

      if (data.user) {
        const updatedUser: User = {
          ...state.user!,
          name: params.name || state.user?.name,
          avatar_url: params.avatar_url || state.user?.avatar_url,
        };
        updateState({ user: updatedUser });
      }
    } catch (error: any) {
      updateState({ error: error.message });
      throw error;
    } finally {
      updateState({ isLoading: false });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        clearError: () => updateState({ error: null }),
        inviteUser: async () => ({ success: false }),
        updateFormProgress: async () => ({ success: false }),
        getNextFormPage: () => "/form/step1",
        hasCompletedForm: () => false,
        setUser: (user) => updateState({ user }),
        setSession,
        setIsLoading: (isLoading) => updateState({ isLoading }),
        setIsAuthenticated: (isAuthenticated) =>
          updateState({ isAuthenticated }),
        setError: (error) => updateState({ error }),
        setSurveyResponses: (surveyResponses: SurveyResponses | null) =>
          updateState({ surveyResponses }),
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
