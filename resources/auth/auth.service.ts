import { AuthResponse, createClient, User } from "@supabase/supabase-js";

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

const LOCAL_STORAGE_KEYS = {
  TEAM_ID: "teamId",
  TEAM_MEMBER_ID: "teamMemberId",
  PENDING_INVITE: "radar21_pending_invite",
  PENDING_INVITE_EMAIL: "radar21_pending_invite_email",
  USER_SESSION: "supabase.auth.token",
  LAST_AUTH_USER: "lastAuthUser",
};

// Serviço de autenticação
export const AuthService = {
  // Login com Google
  signInWithGoogle: async (
    options: {
      redirectTo?: string;
      queryParams?: { [key: string]: string };
    } = {}
  ) => {
    try {
      // Determinar a URL base com base no ambiente atual
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://radar21.com.br";

      // Construir a URL de redirecionamento completa
      const redirectUrl = options.redirectTo || `${baseUrl}/auth/callback`;

      console.log("Iniciando fluxo OAuth com redirect para:", redirectUrl);

      // Iniciar o fluxo de autenticação com a URL de redirecionamento correta
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          // Incluímos queryParams se forem fornecidos
          queryParams: options.queryParams,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      throw error;
    }
  },

  // Verificar e obter sessão atual
  getSession: async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro ao obter sessão:", error);
        throw error;
      }

      return session;
    } catch (error) {
      console.error("Erro ao obter sessão:", error);
      return null;
    }
  },

  // Obter usuário atual
  getUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error("Erro ao obter usuário:", error);
      return null;
    }
  },

  // Logout
  signOut: async () => {
    try {
      // Primeiro, limpar o estado local
      AuthService.clearLocalState();

      // Depois, fazer logout no Supabase
      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        console.error("Erro no logout:", error);
        throw error;
      }

      // Limpar cookies de sessão
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Forçar uma nova verificação de sessão
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        throw new Error("Sessão ainda ativa após logout");
      }

      return true;
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  },

  // Ouvir mudanças na autenticação
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Login com Email/Senha
  signInWithEmail: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user || !data.session) {
        throw new Error("Dados de autenticação inválidos");
      }

      return { session: data.session };
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  },

  // Registrar com Email/Senha
  signUpWithEmail: async (
    email: string,
    password: string,
    role: string = "COLLABORATOR"
  ): Promise<AuthResponse> => {
    try {
      console.log("Iniciando registro de usuário:", { email, role });

      // Validar o role antes de prosseguir
      const normalizedRole = role.toUpperCase();
      if (
        ![
          "COLLABORATOR",
          "LEADER",
          "ORGANIZATION",
          "ADMIN",
          "SUPPORT",
        ].includes(normalizedRole)
      ) {
        throw new Error("Papel de usuário inválido");
      }

      // Criar o usuário no Supabase Auth
      const {
        data: { user },
        error,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: normalizedRole,
            email_confirmed: false,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
        },
      });

      if (error) {
        console.error("Erro ao criar usuário no Auth:", error);
        throw error;
      }

      if (!user) {
        console.error("Usuário não foi criado");
        throw new Error("Falha ao criar usuário");
      }

      console.log("Usuário criado no Auth:", {
        userId: user.id,
        email: user.email,
      });

      // Aguardar um momento para o trigger ser executado
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verificar se o perfil foi criado corretamente
      const { data: createdProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (checkError) {
        console.error("Erro ao verificar perfil:", checkError);
        throw new Error(
          `Falha ao verificar perfil do usuário: ${checkError.message}`
        );
      }

      if (!createdProfile) {
        console.error("Perfil não encontrado após criação");
        throw new Error("Falha ao verificar perfil do usuário");
      }

      console.log("Perfil criado com sucesso:", {
        userId: createdProfile.id,
        role: createdProfile.role,
      });

      // Verificar se o role foi definido corretamente
      if (createdProfile.role !== normalizedRole) {
        console.error("Role não corresponde:", {
          expected: normalizedRole,
          actual: createdProfile.role,
        });
        throw new Error("Papel do usuário não foi definido corretamente");
      }

      return {
        data: {
          user,
          session: null,
        },
        error: null,
      };
    } catch (error: any) {
      console.error("Erro ao registrar usuário:", error);
      return {
        data: {
          user: null,
          session: null,
        },
        error,
      };
    }
  },

  // Verificar email
  verifyEmail: async (token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "email",
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Erro ao verificar email:", error);
      throw error;
    }
  },

  /**
   * Verifica e processa automaticamente convites pendentes para o usuário autenticado
   * @param user Usuário autenticado
   */
  processAuthenticatedUser: async (user: User): Promise<void> => {
    if (!user.email) return;

    try {
      // Atualizar metadados do usuário se necessário
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          email_confirmed: !!user.email_confirmed_at,
        },
      });

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Erro ao processar usuário autenticado:", error);
      throw error;
    }
  },

  clearLocalState: () => {
    try {
      // Limpar todas as chaves conhecidas
      Object.values(LOCAL_STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });

      // Limpar sessionStorage
      sessionStorage.clear();

      // Limpar cookies relacionados à autenticação
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    } catch (error) {
      console.error("Erro ao limpar estado local:", error);
    }
  },
};
