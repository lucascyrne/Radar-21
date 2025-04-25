import supabase from "@/lib/supabase/client";
import { User } from "../auth/auth-model";
import { Team } from "../team/team-model";
import {
  Organization,
  OrganizationOpenAnswer,
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
  ): Promise<{ data: User[]; error: any }> {
    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    return { data: data as User[], error };
  }

  // Convidar líder para a organização
  static async inviteLeaderToOrganization(
    organizationId: string,
    email: string
  ): Promise<{ data: User | null; error: any }> {
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

    return { data: memberData as User, error: memberError };
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
    try {
      // Buscar todos os times da organização
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, team_size, created_at, owner_email")
        .eq("organization_id", organizationId);

      if (teamsError) {
        return { data: [], error: teamsError };
      }

      // Para cada time, buscar membros e calcular estatísticas
      const teamOverviews: OrganizationTeamOverview[] = [];

      for (const team of teamsData || []) {
        // Buscar membros do time
        const { data: members, error: membersError } = await supabase
          .from("team_members")
          .select("*")
          .eq("team_id", team.id);

        if (membersError) {
          console.error(
            `Erro ao buscar membros do time ${team.id}:`,
            membersError
          );
          continue;
        }

        const totalMembers = members?.length || team.team_size || 0;
        const respondedMembers =
          members?.filter((m) => m.status === "answered").length || 0;
        const totalLeaders =
          members?.filter((m) => m.role === "leader").length || 0;
        const respondedLeaders =
          members?.filter((m) => m.role === "leader" && m.status === "answered")
            .length || 0;

        teamOverviews.push({
          organization_id: organizationId,
          organization_name: "",
          team_id: team.id,
          team_name: team.name,
          members_answered: respondedMembers,
          total_members: totalMembers,
          team_created_at: team.created_at,
          leaders_answered: respondedLeaders,
          total_leaders: totalLeaders,
          completion_percentage:
            totalMembers > 0
              ? Math.round((respondedMembers / totalMembers) * 100)
              : 0,
        });
      }

      return { data: teamOverviews, error: null };
    } catch (error) {
      console.error("Erro ao buscar visão geral das equipes:", error);
      return { data: [], error };
    }
  }

  // Buscar respostas às perguntas abertas
  static async getOpenAnswers(
    organizationId: string,
    teamId?: string
  ): Promise<{ data: OrganizationOpenAnswer[]; error: any }> {
    try {
      // Buscar times da organização
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("organization_id", organizationId);

      if (teamsError) {
        return { data: [], error: teamsError };
      }

      const teamIds = teamsData?.map((t) => t.id) || [];

      if (teamIds.length === 0) {
        return { data: [], error: null };
      }

      // Se fornecido um team_id específico, filtrar apenas por ele
      if (teamId) {
        if (!teamIds.includes(teamId)) {
          return { data: [], error: null }; // O time não pertence a esta organização
        }
        teamIds.length = 0;
        teamIds.push(teamId);
      }

      // Construir array para armazenar as respostas abertas
      const openAnswers: OrganizationOpenAnswer[] = [];

      // Para cada time, buscar membros com respostas
      for (const tId of teamIds) {
        const teamInfo = teamsData?.find((t) => t.id === tId);

        // Buscar respostas da pesquisa para este time
        const { data: surveyResponses, error: surveyError } = await supabase
          .from("team_survey_responses")
          .select("*")
          .eq("team_id", tId);

        if (surveyError) {
          console.error(
            `Erro ao buscar respostas do time ${tId}:`,
            surveyError
          );
          continue;
        }

        // Processar cada resposta
        for (const response of surveyResponses || []) {
          openAnswers.push({
            organization_id: organizationId,
            organization_name: "",
            team_id: tId,
            team_name: teamInfo?.name || "",
            user_id: response.user_id || "",
            email: response.email || "",
            role: response.role || "",
            leadership_strengths: response.leadership_strengths,
            leadership_improvements: response.leadership_improvements,
            response_date: response.created_at,
          });
        }
      }

      return { data: openAnswers, error: null };
    } catch (error) {
      console.error("Erro ao buscar respostas abertas:", error);
      return { data: [], error };
    }
  }

  // Associar uma equipe à organização
  static async addTeamToOrganization(
    organizationId: string,
    teamId: string
  ): Promise<{ data: Team | null; error: any }> {
    const { data, error } = await supabase
      .from("organization_teams")
      .insert({
        organization_id: organizationId,
        team_id: teamId,
      })
      .select()
      .single();

    return { data: data as Team, error };
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
