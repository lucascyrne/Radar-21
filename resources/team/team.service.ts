import supabase from "@/lib/supabase/client";
import { createClient } from "@supabase/supabase-js";
import {
  Team,
  TeamMember,
  TeamMemberStatus,
  TeamSurveyResponse,
} from "./team-model";

// Cache para armazenar resultados de requisições
const cache = {
  teams: new Map<string, { data: any; timestamp: number }>(),
  members: new Map<string, { data: any; timestamp: number }>(),
  users: new Map<string, { data: any; timestamp: number }>(),
};

// Tempo de expiração do cache em milissegundos (5 minutos)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export const TeamService = {
  /**
   * Busca um usuário pelo email
   * @param email Email do usuário
   * @returns ID do usuário ou null se não encontrado
   */
  async getUserByEmail(email: string): Promise<string | null> {
    try {
      // Buscar usuário pelo email no perfil
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Usuário não encontrado
          return null;
        }
        console.error("Erro ao buscar usuário:", error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return null;
    }
  },

  /**
   * Cria uma nova equipe
   * @param name Nome da equipe
   * @param ownerId ID do proprietário da equipe
   * @param ownerEmail Email do proprietário da equipe
   * @param teamSize Tamanho da equipe
   * @returns Dados da equipe criada
   */
  async createTeam(
    name: string,
    ownerId: string,
    ownerEmail: string,
    teamSize: number
  ): Promise<Team> {
    try {
      // Log para debug
      console.log("Tentando criar equipe com os seguintes dados:", {
        name,
        ownerId,
        ownerEmail,
        teamSize,
      });

      const { data, error } = await supabase
        .from("teams")
        .insert({
          name,
          owner_id: ownerId,
          owner_email: ownerEmail,
          team_size: teamSize,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro detalhado ao criar equipe:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw new Error(`Erro ao criar equipe: ${error.message}`);
      }

      return data as Team;
    } catch (error: any) {
      console.error("Erro ao criar equipe:", error);
      throw new Error(`Erro ao criar equipe: ${error.message}`);
    }
  },

  /**
   * Adiciona um membro à equipe
   * @param teamId ID da equipe
   * @param userId ID do usuário (pode ser null para convites)
   * @param email Email do membro
   * @param role Papel do membro na equipe
   * @param status Status do membro na equipe
   */
  async addTeamMember(
    teamId: string,
    userId: string | null,
    email: string,
    role: string,
    status: string
  ): Promise<void> {
    try {
      // Se houver um userId, verificar se não é uma organização
      if (userId) {
        const { data: userProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("auth_id", userId)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        // Se for uma organização, não permitir adicionar como membro
        if (userProfile?.role === "ORGANIZATION") {
          console.log(
            "Usuário é uma organização, não será adicionado como membro"
          );
          return;
        }
      }

      // Verificar se o membro já existe
      const { data: existingMember, error: checkError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId)
        .eq("email", email)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingMember) {
        // Se o membro já existe, não rebaixar seu status
        let newStatus = status;
        if (existingMember.status === "answered" && status !== "answered") {
          newStatus = "answered";
        } else if (
          existingMember.status === "invited" &&
          status === "invited"
        ) {
          newStatus = "invited";
        }

        const updates: any = { status: newStatus };
        if (
          userId &&
          (!existingMember.user_id || existingMember.user_id !== userId)
        ) {
          updates.user_id = userId;
        }

        const { error: updateError } = await supabase
          .from("team_members")
          .update(updates)
          .eq("id", existingMember.id);

        if (updateError) {
          // Em caso de erro com RLS, tenta usar a API do servidor
          if (
            updateError.message &&
            updateError.message.includes("row-level security policy")
          ) {
            try {
              // Usar API para contornar limitações de RLS
              const response = await fetch("/api/process-invite", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  teamId,
                  userId,
                  email,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                  errorData.error || "Erro ao adicionar membro à equipe"
                );
              }
            } catch (apiError: any) {
              console.error("Erro na API ao adicionar membro:", apiError);
              throw apiError;
            }
          } else {
            throw updateError;
          }
        }
      } else {
        // Se o membro não existe, criar novo
        const memberStatus = userId ? status : "invited";

        try {
          const { error } = await supabase.from("team_members").insert({
            team_id: teamId,
            user_id: userId,
            email,
            role,
            status: memberStatus,
          });

          if (error) {
            // Em caso de erro com RLS, tenta usar a API do servidor
            if (
              error.message &&
              error.message.includes("row-level security policy")
            ) {
              const response = await fetch("/api/process-invite", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  teamId,
                  userId,
                  email,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                  errorData.error || "Erro ao adicionar membro à equipe"
                );
              }
            } else {
              throw error;
            }
          }
        } catch (insertError: any) {
          console.error("Erro ao inserir membro na equipe:", insertError);
          throw insertError;
        }
      }

      // Limpar cache para forçar recarregamento
      cache.members.delete(teamId);
    } catch (error: any) {
      console.error("Erro ao adicionar membro à equipe:", error);
      throw error;
    }
  },

  /**
   * Obtém as equipes do usuário
   * @param userId ID do usuário
   * @returns Lista de equipes e associações do usuário
   */
  async getUserTeams(userId: string): Promise<{ teams: Team[] }> {
    try {
      // Primeiro, buscar os IDs dos times do usuário
      const { data: memberTeams, error: memberError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId);

      if (memberError) {
        console.error("Erro ao buscar associações de equipe:", memberError);
        throw memberError;
      }

      // Se não houver times, retornar array vazio
      if (!memberTeams || memberTeams.length === 0) {
        return { teams: [] };
      }

      // Buscar detalhes dos times usando os IDs encontrados
      const teamIds = memberTeams.map((mt) => mt.team_id);
      const { data: teams, error } = await supabase
        .from("teams")
        .select("id, name, owner_id, owner_email, team_size, created_at")
        .in("id", teamIds);

      if (error) {
        console.error("Erro na query:", error);
        throw error;
      }

      console.log("Teams encontradas:", teams);
      return { teams: teams || [] };
    } catch (error) {
      console.error("Erro ao buscar equipes do usuário:", error);
      throw error;
    }
  },

  /**
   * Obtém os membros de uma equipe
   * @param teamId ID da equipe
   * @returns Lista de membros da equipe
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      if (!teamId) {
        return [];
      }

      // Verificar se há dados em cache e se ainda são válidos
      const cachedData = cache.members.get(teamId);
      if (cachedData) {
        const now = Date.now();
        if (now - cachedData.timestamp < CACHE_EXPIRATION) {
          return cachedData.data;
        }
      }

      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId);

      if (error) {
        throw new Error(`Erro ao buscar membros da equipe: ${error.message}`);
      }

      const members = data || [];

      // Armazenar resultado em cache
      cache.members.set(teamId, {
        data: members as TeamMember[],
        timestamp: Date.now(),
      });

      return members as TeamMember[];
    } catch (error: any) {
      console.error("Erro ao buscar membros da equipe:", error);
      return [];
    }
  },

  /**
   * Gera uma mensagem de convite padrão
   * @param teamName Nome da equipe
   * @param fromEmail Email do remetente
   * @returns Mensagem de convite formatada
   */
  generateInviteMessage(teamName: string, fromEmail: string): string {
    return `Olá! Estou convidando você para participar da equipe "${teamName}" no Radar21 (www.radar21.com.br) - uma plataforma para avaliação de competências de liderança na era da Indústria 4.0. Sua participação é muito importante para entendermos o perfil de nossa equipe. Por favor, aceite o convite e responda o questionário. Obrigado! - ${fromEmail}`;
  },

  /**
   * Atualiza o status de um membro da equipe
   * @param teamId ID da equipe
   * @param email Email do membro
   * @param status Novo status
   */
  async updateMemberStatus(
    teamId: string,
    email: string,
    status: TeamMemberStatus
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ status })
        .eq("team_id", teamId)
        .eq("email", email);

      if (error) {
        throw new Error(`Erro ao atualizar status do membro: ${error.message}`);
      }

      // Invalidar cache de membros para esta equipe
      cache.members.delete(teamId);
    } catch (error: any) {
      console.error("Erro ao atualizar status do membro:", error);
      throw new Error(`Erro ao atualizar status do membro: ${error.message}`);
    }
  },

  /**
   * Obtém um membro específico da equipe
   * @param teamId ID da equipe
   * @param email Email do membro
   * @returns Dados do membro ou null se não encontrado
   */
  async getTeamMember(
    teamId: string,
    email: string
  ): Promise<TeamMember | null> {
    try {
      if (!teamId || !email) {
        return null;
      }

      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId)
        .eq("email", email)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Membro não encontrado
        }
        throw new Error(`Erro ao buscar membro da equipe: ${error.message}`);
      }

      return data as TeamMember;
    } catch (error: any) {
      console.error("Erro ao buscar membro da equipe:", error);
      return null;
    }
  },

  /**
   * Verifica se um membro já existe na equipe
   * @param teamId ID da equipe
   * @param email Email do membro
   * @returns Booleano indicando se o membro existe
   */
  async checkTeamMemberExists(teamId: string, email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("email", email)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return false; // Não encontrou
        }
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error("Erro ao verificar existência do membro:", error);
      return false;
    }
  },

  /**
   * Obtém o ID da equipe para um convite
   * @param inviteCode Código do convite (ID da equipe)
   * @returns Detalhes da equipe ou null se não encontrada
   */
  async getTeamByInvite(inviteCode: string): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", inviteCode)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Não encontrou
        }
        throw error;
      }

      return data as Team;
    } catch (error) {
      console.error("Erro ao buscar equipe por convite:", error);
      return null;
    }
  },

  /**
   * Processa um convite para um usuário, associando-o a uma equipe
   * @param teamId ID da equipe
   * @param userId ID do usuário autenticado
   * @param email Email do usuário
   * @returns ID do membro da equipe processado
   */
  async processInvite(
    teamId: string,
    userId: string,
    email: string
  ): Promise<string | null> {
    try {
      console.log(
        `Processando convite: teamId=${teamId}, userId=${userId}, email=${email}`
      );

      // Verificar se o usuário é uma organização
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("auth_id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      // Se for uma organização, não permitir processar o convite
      if (userProfile?.role === "ORGANIZATION") {
        console.log("Usuário é uma organização, convite não será processado");
        return null;
      }

      // Verificar se o membro já existe
      const { data: existingMember, error: checkError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId)
        .eq("email", email)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingMember) {
        console.log("Membro existente encontrado:", existingMember);
        // Sempre atualizar o user_id e status para garantir associação
        const { data: updatedMember, error: updateError } = await supabase
          .from("team_members")
          .update({
            user_id: userId,
            status:
              existingMember.status === "answered" ? "answered" : "invited",
          })
          .eq("id", existingMember.id)
          .select()
          .single();

        if (updateError) throw updateError;
        console.log("Membro atualizado:", updatedMember);
        return updatedMember?.id || null;
      }

      // Se não existir, criar novo membro
      console.log("Criando novo membro da equipe");
      const { data: newMember, error: insertError } = await supabase
        .from("team_members")
        .insert({
          team_id: teamId,
          user_id: userId,
          email: email,
          role: "member",
          status: "invited",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      console.log("Novo membro criado:", newMember);
      return newMember?.id || null;
    } catch (error) {
      console.error("Erro ao processar convite:", error);
      throw error;
    }
  },

  /**
   * Sincroniza associações de equipe para um usuário usando seu email
   * @param userId ID do usuário
   * @param email Email do usuário
   */
  async syncUserTeamMemberships(userId: string, email: string): Promise<void> {
    try {
      console.log(
        `Sincronizando associações de equipe para userId=${userId}, email=${email}`
      );

      // Buscar todos os convites baseados no email
      const { data: emailInvites, error: invitesError } = await supabase
        .from("team_members")
        .select("*")
        .eq("email", email)
        .is("user_id", null);

      if (invitesError) {
        console.error("Erro ao buscar convites por email:", invitesError);
        throw invitesError;
      }

      console.log(
        `Encontrados ${
          emailInvites?.length || 0
        } convites pendentes para o email`
      );

      // Atualizar todos os convites com o ID do usuário
      for (const invite of emailInvites || []) {
        const { error: updateError } = await supabase
          .from("team_members")
          .update({ user_id: userId })
          .eq("id", invite.id);

        if (updateError) {
          console.error(`Erro ao atualizar convite ${invite.id}:`, updateError);
          // Continua mesmo com erro
        } else {
          console.log(`Convite ${invite.id} atualizado com sucesso`);
        }
      }

      // Limpar caches relevantes
      for (const invite of emailInvites || []) {
        cache.members.delete(invite.team_id);
      }

      console.log("Sincronização de associações de equipe concluída");
    } catch (error) {
      console.error("Erro ao sincronizar associações de equipe:", error);
      // Não lançar o erro para não interromper o fluxo principal
    }
  },

  /**
   * Padroniza os status dos membros da equipe
   * @param teamId ID da equipe
   */
  async standardizeTeamMemberStatus(teamId: string): Promise<void> {
    try {
      // Mapear status antigos para os novos status padronizados
      const statusMapping: Record<string, string> = {
        enviado: "invited",
        cadastrado: "invited", // Usuário cadastrado mas ainda não respondeu
        respondido: "answered",
      };

      // Buscar todos os membros da equipe
      const { data: members, error: fetchError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId);

      if (fetchError) {
        throw fetchError;
      }

      // Para cada membro, verificar e atualizar status se necessário
      for (const member of members || []) {
        if (
          member.status in statusMapping &&
          member.status !== statusMapping[member.status]
        ) {
          const { error: updateError } = await supabase
            .from("team_members")
            .update({ status: statusMapping[member.status] })
            .eq("id", member.id);

          if (updateError) {
            console.error(
              `Erro ao atualizar status do membro ${member.id}:`,
              updateError
            );
          }
        }
      }

      // Invalidar cache de membros para esta equipe
      cache.members.delete(teamId);
    } catch (error: any) {
      console.error("Erro ao padronizar status dos membros:", error);
    }
  },

  /**
   * Obtém as respostas da pesquisa dos membros de uma equipe
   * @param teamId ID da equipe
   * @returns Lista de respostas dos membros
   */
  async getTeamSurveyResponses(teamId: string): Promise<TeamSurveyResponse[]> {
    try {
      const { data: responses, error } = await supabase
        .from("team_survey_responses")
        .select("*")
        .eq("team_id", teamId);

      if (error) {
        console.error("Erro ao buscar respostas da equipe:", error);
        return [];
      }

      return responses || [];
    } catch (error) {
      console.error("Erro ao carregar respostas da equipe:", error);
      return [];
    }
  },

  // Função para criar cliente admin do Supabase (usado para operações privilegiadas)
  // Esta função deve ser chamada apenas no servidor
  createAdminClient: () => {
    // Verificar se estamos em ambiente de servidor
    if (typeof window !== "undefined") {
      console.warn("createAdminClient não deve ser usado no cliente");
      return null;
    }

    try {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    } catch (error) {
      console.error("Erro ao criar cliente admin do Supabase:", error);
      return null;
    }
  },
};
