import { InviteService } from "@/resources/invite/invite.service";
import { AuthResponse, createClient, User } from "@supabase/supabase-js";

// Inicializa o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
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

  // Verificar sessão atual
  getSession: async () => {
    try {
      // Forçar refresh da sessão
      await supabase.auth.refreshSession();
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
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
      // Primeiro, limpar estado local
      AuthService.clearLocalState();

      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut({
        scope: "global",
      });

      if (error) throw error;

      // Limpar cookies e storage
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      localStorage.clear();
      sessionStorage.clear();

      // Forçar recarregamento da página após logout
      window.location.href = "/auth";

      return true;
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      AuthService.clearLocalState();
      throw error;
    }
  },

  // Ouvir mudanças na autenticação
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Login com Email/Senha
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Registrar com Email/Senha
  signUpWithEmail: async (
    email: string,
    password: string,
    role: string = "COLLABORATOR"
  ): Promise<AuthResponse> => {
    console.log(`Iniciando registro para ${email} com função ${role}`);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            email_confirmed: false,
          },
        },
      });

      if (error) {
        console.error("Erro detalhado no registro:", {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });

        // Verificar especificamente erros de limite de taxa
        if (
          error.status === 429 ||
          error.message?.toLowerCase().includes("rate limit")
        ) {
          console.error("Limite de taxa do Supabase atingido:", {
            email,
            timestamp: new Date().toISOString(),
            errorDetails: error,
          });
          throw new Error(
            "Muitas tentativas de registro. Por favor, tente novamente mais tarde."
          );
        }

        throw error;
      }

      if (!user) {
        console.error("Usuário não criado:", {
          email,
          timestamp: new Date().toISOString(),
        });
        throw new Error("Falha ao criar usuário");
      }

      console.log("Usuário criado com sucesso:", {
        userId: user.id,
        email: user.email,
        confirmationSent: user.confirmation_sent_at,
        timestamp: new Date().toISOString(),
      });

      if (!user.confirmation_sent_at) {
        console.warn("Email de confirmação não enviado:", {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        data: {
          user,
          session: null,
        },
        error: null,
      };
    } catch (error: any) {
      console.error("Erro não tratado no registro:", {
        error,
        email,
        timestamp: new Date().toISOString(),
      });

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
      // Processar convite pendente se existir
      const teamId = await InviteService.processInvite(user.id, user.email);

      if (teamId) {
        // Atualizar os metadados do usuário com o teamId
        const { error } = await supabase.auth.updateUser({
          data: {
            team_id: teamId,
            status: "pending_survey",
          },
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Erro ao processar usuário autenticado:", error);
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
