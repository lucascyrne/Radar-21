"use client";

import supabase from "@/lib/supabase/client";
import { Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";
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
    return pathname?.startsWith("/auth");
  }, [pathname]);

  // Verifica se estamos em um subdomínio de organização
  const isOrgSubdomain = useCallback(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      return hostname.startsWith("org.") || hostname.includes(".org.");
    }
    return false;
  }, []);

  // Redireciona o usuário para a página correta
  const redirectAuthenticatedUser = useCallback(() => {
    if (!state.user || !state.isAuthenticated) return;

    const isOrg = state.user.role === "ORGANIZATION";
    const onOrgSubdomain = isOrgSubdomain();
    const onAuthPage = isAuthPage();

    console.log("Verificando redirecionamento:", {
      isAuthenticated: state.isAuthenticated,
      userRole: state.user.role,
      pathname,
      isOrg,
      onOrgSubdomain,
      onAuthPage,
    });

    // Redirecionar usuários autenticados que estão na página de autenticação
    if (onAuthPage) {
      if (isOrg && onOrgSubdomain) {
        console.log("Redirecionando para dashboard de organização");
        router.push("/org/dashboard");
      } else if (!isOrg && !onOrgSubdomain) {
        console.log("Redirecionando para team-setup");
        router.push("/team-setup");
      }
    }
    // Redirecionar usuários comuns autenticados em páginas de root (/) para team-setup
    else if (!isOrg && !onOrgSubdomain && pathname === "/") {
      console.log(
        "Redirecionando usuário comum da página raiz para team-setup"
      );
      router.push("/team-setup");
    }
  }, [
    state.user,
    state.isAuthenticated,
    isOrgSubdomain,
    isAuthPage,
    pathname,
    router,
  ]);

  // Efeito para redirecionar usuário autenticado
  useEffect(() => {
    console.log("Estado de autenticação alterado:", {
      isAuthenticated: state.isAuthenticated,
      pathname,
      user: state.user?.role,
    });
    redirectAuthenticatedUser();
  }, [state.isAuthenticated, pathname, redirectAuthenticatedUser, state.user]);

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
  }, []);

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

  const signInWithEmail = async (email: string, password: string) => {
    try {
      updateState({ isLoading: true, error: null });
      const session = await AuthService.signInWithEmail(email, password);

      if (!session) {
        throw new Error("Erro ao fazer login");
      }

      setSession(session);

      // Verificar se é usuário organização e redirecionar
      const userRole = session.user.user_metadata?.role;
      const isOrg = userRole === "ORGANIZATION";

      if (isOrg) {
        console.log("Login bem-sucedido para usuário organização");
        // Redirecionamento é feito pelo middleware ou pela página auth/login
      } else {
        console.log("Login bem-sucedido, redirecionando para team-setup");
        router.push("/team-setup");
      }

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
      localStorage.clear();
      router.push("/auth/login");
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
      const response = await AuthService.signUpWithEmail(email, password, role);

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
