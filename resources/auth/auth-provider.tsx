"use client";

import supabase from "@/lib/supabase/client";
import { Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { SurveyResponses } from "../survey/survey-model";
import AuthContext, { initialState } from "./auth-context";
import { AuthState, UpdateProfileParams, User } from "./auth-model";
import { AuthService } from "./auth.service";

interface AuthProviderProps {
  children: ReactNode;
}

const SESSION_STORAGE_KEY = "radar21_auth_session";

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>(() => {
    if (typeof window === "undefined") {
      return initialState;
    }

    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        return {
          ...initialState,
          ...parsed,
          isAuthenticated: true,
          isLoading: false,
        };
      } catch (e) {
        console.error("Erro ao parsear sessão salva:", e);
      }
    }
    return initialState;
  });

  const router = useRouter();
  const pathname = usePathname();
  const stateRef = useRef(state);

  // Manter referência atualizada do estado
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((current) => {
      const newState = { ...current, ...updates };
      if (typeof window !== "undefined" && updates.session) {
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            user: newState.user,
            session: newState.session,
            surveyResponses: newState.surveyResponses,
          })
        );
      }
      return newState;
    });
  }, []);

  // Verifica se estamos em uma página de autenticação
  const isAuthPage = useCallback(() => {
    return pathname?.startsWith("/auth") || pathname?.startsWith("/org-auth");
  }, [pathname]);

  // Verifica se estamos em um subdomínio de organização
  const isOrgSubdomain = useCallback(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      return hostname.startsWith("org.");
    }
    return false;
  }, []);

  // Redireciona o usuário para a página correta
  const redirectAuthenticatedUser = useCallback(() => {
    if (!state.user || !state.isAuthenticated) return;

    const isOrg = state.user.role === "ORGANIZATION";
    const onOrgSubdomain = isOrgSubdomain();

    // Apenas redirecionar se estiver na página de autenticação
    if (!isAuthPage()) return;

    // Redirecionar para a página inicial apropriada
    if (isOrg && onOrgSubdomain) {
      router.push("/dashboard");
    } else if (isOrg && !onOrgSubdomain) {
      // Se for organização mas estiver no domínio principal, redirecionar para o subdomínio
      const protocol = window.location.protocol;
      const host = window.location.host;
      window.location.href = `${protocol}//org.${host}/dashboard`;
    } else if (!isOrg && onOrgSubdomain) {
      // Se for usuário regular mas estiver no subdomínio org, redirecionar para o domínio principal
      const protocol = window.location.protocol;
      const host = window.location.host.replace(/^org\./, "");
      window.location.href = `${protocol}//${host}/team-setup`;
    } else if (!isOrg && !onOrgSubdomain) {
      router.push("/team-setup");
    }
  }, [state.user, state.isAuthenticated, isOrgSubdomain, isAuthPage, router]);

  // Efeito para redirecionar usuário autenticado
  useEffect(() => {
    if (state.isAuthenticated) {
      redirectAuthenticatedUser();
    }
  }, [state.isAuthenticated]);

  const setSession = useCallback(
    (session: Session | null) => {
      if (!session) {
        updateState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          surveyResponses: null,
        });

        if (typeof window !== "undefined") {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
        return null;
      }

      const userRole = session.user.user_metadata?.role;
      const user: User = {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.user_metadata?.name || "",
        avatar_url: session.user.user_metadata?.avatar_url || "",
        role: userRole,
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
    },
    [updateState]
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setState(initialState);
        if (typeof window !== "undefined") {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSession(session);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        updateState({ isLoading: true, error: null });
        const session = await AuthService.signInWithEmail(email, password);

        if (!session) {
          throw new Error("Erro ao fazer login");
        }

        const user = setSession(session);
        return session;
      } catch (error: any) {
        console.error("Erro no login:", error);
        updateState({ error: error.message, isLoading: false });
        throw error;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });
      await AuthService.signOut();
      setState(initialState);
      localStorage.clear();

      // Verificar se estamos no subdomínio org
      const isOrgSubdomain =
        typeof window !== "undefined"
          ? window.location.hostname.startsWith("org.")
          : false;

      if (isOrgSubdomain) {
        router.push("/org-auth/login");
      } else {
        router.push("/auth/login");
      }
    } catch (error: any) {
      updateState({ error: error.message, isLoading: false });
    }
  }, [router]);

  const signInWithGoogle = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });
      await AuthService.signInWithGoogle({
        redirectTo: `${window.location.origin}/auth/callback`,
      });
    } catch (error: any) {
      updateState({ error: error.message, isLoading: false });
      throw error;
    }
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, role: string) => {
      try {
        updateState({ isLoading: true, error: null });
        const response = await AuthService.signUpWithEmail(
          email,
          password,
          role
        );

        if (response.error) {
          updateState({ error: response.error.message, isLoading: false });
        } else {
          updateState({ isLoading: false });
        }

        return response;
      } catch (error: any) {
        updateState({ error: error.message, isLoading: false });
        return { data: { user: null, session: null }, error };
      }
    },
    []
  );

  const updateProfile = useCallback(async (params: UpdateProfileParams) => {
    try {
      updateState({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: params.name,
          avatar_url: params.avatar_url,
        },
      });

      if (error) throw error;

      if (data.user && stateRef.current.user) {
        const updatedUser: User = {
          ...stateRef.current.user,
          name: params.name || stateRef.current.user.name,
          avatar_url: params.avatar_url || stateRef.current.user.avatar_url,
        };
        updateState({ user: updatedUser });
      }
    } catch (error: any) {
      updateState({ error: error.message });
      throw error;
    } finally {
      updateState({ isLoading: false });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        clearError: useCallback(() => updateState({ error: null }), []),
        inviteUser: async () => ({ success: false }),
        updateFormProgress: async () => ({ success: false }),
        getNextFormPage: () => "/form/step1",
        hasCompletedForm: () => false,
        setUser: useCallback((user) => updateState({ user }), [updateState]),
        setSession,
        setIsLoading: useCallback(
          (isLoading) => updateState({ isLoading }),
          []
        ),
        setIsAuthenticated: useCallback(
          (isAuthenticated) => updateState({ isAuthenticated }),
          []
        ),
        setError: useCallback((error) => updateState({ error }), [updateState]),
        setSurveyResponses: useCallback(
          (surveyResponses: SurveyResponses | null) =>
            updateState({ surveyResponses }),
          []
        ),
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
