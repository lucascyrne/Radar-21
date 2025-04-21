import supabase from "@/lib/supabase/client";
import {
  Organization,
  OrganizationMember,
  OrganizationOpenAnswer,
  OrganizationTeam,
  OrganizationTeamOverview,
} from "./organization-model";

export class OrganizationService {
  // Criar uma nova organização
  static async createOrganization(
    name: string
  ): Promise<{ data: Organization | null; error: any }> {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return {
        data: null,
        error: userError || new Error("Usuário não autenticado"),
      };
    }

    const { data, error } = await supabase.rpc("create_organization", {
      org_name: name,
      owner_email: userData.user.email,
    });

    if (error) {
      return { data: null, error };
    }

    // Buscar a organização recém-criada
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", data)
      .single();

    return { data: orgData as Organization, error: orgError };
  }

  // Buscar organizações do usuário atual
  static async getMyOrganizations(): Promise<{
    data: Organization[];
    error: any;
  }> {
    // Primeiro, buscar as organizações onde o usuário é proprietário
    const { data: ownedOrgs, error: ownedError } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (ownedError) {
      return { data: [], error: ownedError };
    }

    // Depois, buscar as organizações onde o usuário é membro
    const { data: memberOrgs, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id, organizations(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (memberError) {
      return { data: ownedOrgs || [], error: memberError };
    }

    // Combinar as duas listas
    const memberOrgsList = memberOrgs
      ? memberOrgs.map((item) => item.organizations as unknown as Organization)
      : [];

    // Remover duplicatas usando Set com IDs
    const uniqueOrgIds = new Set([
      ...(ownedOrgs || []).map((org) => org.id),
      ...memberOrgsList.map((org) => org.id),
    ]);

    const allOrgs = [
      ...(ownedOrgs || []),
      ...memberOrgsList.filter(
        (org) => !ownedOrgs?.some((o) => o.id === org.id)
      ),
    ];

    return { data: allOrgs, error: null };
  }

  // Buscar detalhes de uma organização específica
  static async getOrganization(
    id: string
  ): Promise<{ data: Organization | null; error: any }> {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();

    return { data: data as Organization, error };
  }

  // Buscar membros da organização
  static async getOrganizationMembers(
    organizationId: string
  ): Promise<{ data: OrganizationMember[]; error: any }> {
    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    return { data: data as OrganizationMember[], error };
  }

  // Convidar líder para a organização
  static async inviteLeaderToOrganization(
    organizationId: string,
    email: string
  ): Promise<{ data: OrganizationMember | null; error: any }> {
    const { data, error } = await supabase.rpc(
      "invite_leader_to_organization",
      {
        org_id: organizationId,
        leader_email: email,
      }
    );

    if (error) {
      return { data: null, error };
    }

    // Buscar o registro recém-criado
    const { data: memberData, error: memberError } = await supabase
      .from("organization_members")
      .select("*")
      .eq("id", data)
      .single();

    // Enviar email de convite
    if (!memberError && memberData) {
      const { error: inviteError } = await supabase.functions.invoke(
        "invite-leader",
        {
          body: {
            email,
            organizationId,
            role: "LEADER",
          },
        }
      );

      if (inviteError) {
        console.error("Erro ao enviar convite:", inviteError);
      }
    }

    return { data: memberData as OrganizationMember, error: memberError };
  }

  // Remover membro da organização
  static async removeOrganizationMember(
    memberId: string
  ): Promise<{ success: boolean; error: any }> {
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", memberId);

    return { success: !error, error };
  }

  // Buscar visão geral das equipes
  static async getTeamOverviews(
    organizationId: string
  ): Promise<{ data: OrganizationTeamOverview[]; error: any }> {
    const { data, error } = await supabase
      .from("organization_team_overview")
      .select("*")
      .eq("organization_id", organizationId);

    // Calcular porcentagem de conclusão para cada equipe
    const teamOverviews = data?.map((team) => ({
      ...team,
      completion_percentage:
        team.total_members > 0
          ? Math.round((team.members_answered / team.total_members) * 100)
          : 0,
    }));

    return { data: teamOverviews as OrganizationTeamOverview[], error };
  }

  // Buscar respostas às perguntas abertas
  static async getOpenAnswers(
    organizationId: string,
    teamId?: string
  ): Promise<{ data: OrganizationOpenAnswer[]; error: any }> {
    let query = supabase
      .from("organization_open_answers")
      .select("*")
      .eq("organization_id", organizationId);

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data, error } = await query;

    return { data: data as OrganizationOpenAnswer[], error };
  }

  // Associar uma equipe à organização
  static async addTeamToOrganization(
    organizationId: string,
    teamId: string
  ): Promise<{ data: OrganizationTeam | null; error: any }> {
    const { data, error } = await supabase
      .from("organization_teams")
      .insert({
        organization_id: organizationId,
        team_id: teamId,
      })
      .select()
      .single();

    return { data: data as OrganizationTeam, error };
  }

  // Remover uma equipe da organização
  static async removeTeamFromOrganization(
    organizationId: string,
    teamId: string
  ): Promise<{ success: boolean; error: any }> {
    const { error } = await supabase
      .from("organization_teams")
      .delete()
      .eq("organization_id", organizationId)
      .eq("team_id", teamId);

    return { success: !error, error };
  }
}
