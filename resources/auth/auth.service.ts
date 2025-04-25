import supabase from "@/lib/supabase/client";
import { AuthResponse, User } from "@supabase/supabase-js";

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
      let baseUrl;
      if (typeof window !== "undefined") {
        // Verificar se estamos em um subdomínio org
        const isOrgSubdomain = window.location.hostname.startsWith("org.");

        if (isOrgSubdomain) {
          // Se estiver no subdomínio org, manter o mesmo host para o callback
          baseUrl = window.location.origin;
        } else {
          // Se estiver no domínio principal, manter o domínio principal
          baseUrl = window.location.origin;
        }
      } else {
        // Fallback para servidor
        baseUrl = "https://radar21.com.br";
      }

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
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro no logout:", error);
        throw error;
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

      // Buscar o papel real do usuário na tabela user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("email", email)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Erro ao buscar perfil:", profileError);
      }

      // Usar o papel do perfil ou fallback para os metadados existentes
      const userRole = profileData?.role || data.user.user_metadata?.role;

      if (userRole) {
        // Atualizar os metadados do usuário com o papel
        await supabase.auth.updateUser({
          data: { role: userRole },
        });

        // Atualizar a sessão com o papel
        data.session.user.user_metadata = {
          ...data.session.user.user_metadata,
          role: userRole,
        };
      }

      return data.session;
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
      if (!["USER", "ORGANIZATION"].includes(normalizedRole)) {
        throw new Error("Papel de usuário inválido");
      }

      // Determinar URL de redirecionamento apropriado com base no hostname
      let redirectUrl;
      if (typeof window !== "undefined") {
        const isOrgSubdomain = window.location.hostname.startsWith("org.");

        if (normalizedRole === "ORGANIZATION" && !isOrgSubdomain) {
          // Se estiver registrando uma organização mas não estiver no subdomínio org,
          // redirecionar para o subdomínio org
          const protocol = window.location.protocol;
          const host = window.location.host;
          redirectUrl = `${protocol}//org.${host.replace(
            /^org\./,
            ""
          )}/auth/callback?type=signup`;
        } else if (normalizedRole !== "ORGANIZATION" && isOrgSubdomain) {
          // Se estiver registrando um usuário regular mas estiver no subdomínio org,
          // redirecionar para o domínio principal
          const protocol = window.location.protocol;
          const host = window.location.host;
          redirectUrl = `${protocol}//${host.replace(
            /^org\./,
            ""
          )}/auth/callback?type=signup`;
        } else {
          // Caso padrão: mesmo domínio
          redirectUrl = `${window.location.origin}/auth/callback?type=signup`;
        }
      } else {
        // Fallback para servidor
        redirectUrl = `https://radar21.com.br/auth/callback?type=signup`;
      }

      // Criar o usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: normalizedRole,
            email_confirmed: false,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("Erro ao criar usuário no Auth:", error);
        throw error;
      }

      if (!data.user) {
        console.error("Usuário não foi criado");
        throw new Error("Falha ao criar usuário");
      }

      console.log("Usuário criado no Auth:", {
        userId: data.user.id,
        email: data.user.email,
      });

      // Retornar imediatamente após criar o usuário
      // O trigger handle_new_user cuidará da criação do perfil
      return {
        data: {
          user: data.user,
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

  async getUserByEmail(email: string): Promise<string | null> {
    try {
      // Primeiro tentar buscar pelo email diretamente
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, auth_id")
        .eq("email", email)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          // Tentar buscar pelo auth.users
          const { data: authData, error: authError } =
            await supabase.auth.admin.getUserById(email);

          if (authError || !authData?.user) {
            return null;
          }

          // Se encontrou na auth.users mas não no profile, criar o profile
          const { data: newProfile, error: createError } = await supabase
            .from("user_profiles")
            .insert({
              email: email,
              auth_id: authData.user.id,
              role: authData.user.user_metadata?.role || "USER",
            })
            .select("id")
            .single();

          if (createError) {
            console.error("Erro ao criar perfil:", createError);
            return null;
          }

          return newProfile?.id || null;
        }
        console.error("Erro ao buscar usuário:", profileError);
        return null;
      }

      // Retornar o ID do perfil ou o auth_id se o perfil não tiver ID próprio
      return profileData?.id || profileData?.auth_id || null;
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return null;
    }
  },
};
