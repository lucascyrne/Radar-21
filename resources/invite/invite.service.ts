import supabase from "@/lib/supabase/client";
import { TeamMember } from "@/resources/team/team-model";
import { InviteData, InviteStatus, TeamInvite } from "./invite-model";

const STORAGE_KEY = "radar21_pending_invite";
const INVITE_EMAIL_KEY = "radar21_pending_invite_email";

// Não inicializamos o Resend no cliente
// Essa biblioteca só deve ser usada no servidor (API routes)

export class InviteService {
  static async sendInvite(data: InviteData): Promise<TeamInvite | null> {
    try {
      const { teamId, email, teamName, invitedBy, message } = data;
      // Verificar se o usuário já existe no sistema
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", email)
        .single();

      // Se o usuário já existe, verificar se já está na equipe
      if (existingUser) {
        const { data: existingMember } = await supabase
          .from("team_members")
          .select("*")
          .eq("team_id", teamId)
          .eq("user_id", existingUser.id)
          .single();

        if (existingMember) {
          throw new Error("Usuário já é membro desta equipe");
        }
      }

      // Criar o convite
      const { data: invite, error: inviteError } = await supabase
        .from("team_invites")
        .insert({
          team_id: teamId,
          email: email,
          status: "PENDING",
          invited_by: invitedBy,
          message: message,
        })
        .select()
        .single();

      if (inviteError) {
        console.error("Erro ao criar convite:", inviteError);
        throw new Error("Erro ao criar convite");
      }

      // Gerar token de convite
      const inviteToken = btoa(
        JSON.stringify({
          teamId,
          email,
          timestamp: new Date().getTime(),
        })
      );

      // Ao invés de enviar o email diretamente, chamamos a API
      // Esta chamada de API deve ser feita no cliente
      // Aqui apenas preparamos os dados do convite

      return invite as TeamInvite;
    } catch (error) {
      console.error("Erro ao processar convite:", error);
      throw error;
    }
  }

  static async getInvite(inviteId: string): Promise<TeamInvite | null> {
    try {
      const { data: invite, error } = await supabase
        .from("team_invites")
        .select("*")
        .eq("id", inviteId)
        .single();

      if (error) {
        console.error("Erro ao buscar convite:", error);
        return null;
      }

      return invite as TeamInvite;
    } catch (error) {
      console.error("Erro ao buscar convite:", error);
      return null;
    }
  }

  static async acceptInvite(inviteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("team_invites")
        .update({ status: InviteStatus.ACCEPTED })
        .eq("id", inviteId);

      if (error) {
        console.error("Erro ao aceitar convite:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao aceitar convite:", error);
      return false;
    }
  }

  static async rejectInvite(inviteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("team_invites")
        .update({ status: InviteStatus.REJECTED })
        .eq("id", inviteId);

      if (error) {
        console.error("Erro ao rejeitar convite:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao rejeitar convite:", error);
      return false;
    }
  }

  static async getInvitesByTeam(teamId: string): Promise<TeamMember[]> {
    const { data: invites, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .eq("status", "invited");

    if (error) throw error;
    return invites;
  }

  static async processInvite(
    userId: string,
    email: string
  ): Promise<string | null> {
    try {
      // Verificar se existe um convite pendente no storage
      const pendingTeamId = this.getPendingInvite();
      const pendingEmail = this.getPendingInviteEmail();

      // Se não houver convite pendente, retornar sem erro
      if (!pendingTeamId || !pendingEmail) {
        return null;
      }

      // Verificar se o email do usuário corresponde ao do convite
      if (email !== pendingEmail) {
        throw new Error("Este convite foi enviado para outro email");
      }

      // Verificar o perfil do usuário para garantir que não seja organização
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("auth_id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Erro ao verificar perfil do usuário:", profileError);
      } else if (userProfile?.role === "ORGANIZATION") {
        throw new Error(
          "Contas de organização não podem ser membros de equipes"
        );
      }

      const { error: updateError } = await supabase
        .from("team_members")
        .update({
          user_id: userId,
          status: "pending_survey" as InviteStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("team_id", pendingTeamId)
        .eq("email", email);

      if (updateError) throw updateError;

      // Atualizar os metadados do usuário com o teamId
      const { error: userError } = await supabase.auth.updateUser({
        data: {
          team_id: pendingTeamId,
          role: "member",
          status: "pending_survey",
        },
      });

      if (userError) throw userError;

      // Emitir evento para atualizar a lista de equipes
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("teamUpdate", { detail: { teamId: pendingTeamId } })
        );
      }

      this.clearPendingInvite();
      return pendingTeamId;
    } catch (error) {
      console.error("Erro ao processar convite:", error);
      throw error;
    }
  }

  private static async sendInviteEmail(data: InviteData) {
    // Este método não deve ser usado diretamente no cliente
    // Em vez disso, deve-se chamar a API de convite
    console.warn(
      "sendInviteEmail não deve ser chamado diretamente. Use a API de convite em vez disso."
    );

    try {
      // Enviar requisição para API em vez de usar Resend diretamente
      const response = await fetch("/api/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar email");
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      throw error;
    }
  }

  static storePendingInvite(teamId: string, email: string) {
    localStorage.setItem(STORAGE_KEY, teamId);
    localStorage.setItem(INVITE_EMAIL_KEY, email);
  }

  static getPendingInvite(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  }

  static getPendingInviteEmail(): string | null {
    return localStorage.getItem(INVITE_EMAIL_KEY);
  }

  static clearPendingInvite() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INVITE_EMAIL_KEY);
  }

  /**
   * Verifica se existe um convite pendente para o email fornecido
   * @param email Email do usuário
   * @returns Promise<boolean> True se existir um convite pendente
   */
  static async checkPendingInvite(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("email", email)
        .eq("status", "invited")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return false;
        }
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error("Erro ao verificar convite pendente:", error);
      return false;
    }
  }
}
