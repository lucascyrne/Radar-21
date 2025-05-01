import { createClient } from "@supabase/supabase-js";
import { TeamMemberStatus } from "../team/team-model";
import {
  CompetencyComparison,
  DemographicData,
  DemographicFormValues,
  OpenQuestionResponse,
  OpenQuestionsFormValues,
  SurveyResponse,
  SurveyResponses,
} from "./survey-model";

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Funções auxiliares para tratar erros do Supabase
const handleDataError = (error: any) => {
  if (error.code === "PGRST116") return null;
  if (error.code === "JWT expired") {
    console.warn("Sessão expirada, renovando...");
    return null;
  }
  throw error;
};

const handleBooleanError = (error: any): boolean => {
  if (error.code === "PGRST116" || error.code === "JWT expired") {
    if (error.code === "JWT expired") {
      console.warn("Sessão expirada, renovando...");
    }
    return false;
  }
  throw error;
};

interface SurveyResponseData {
  q1?: number | null;
  q2?: number | null;
  q3?: number | null;
  q4?: number | null;
  q5?: number | null;
  q6?: number | null;
  q7?: number | null;
  q8?: number | null;
  q9?: number | null;
  q10?: number | null;
  q11?: number | null;
  q12?: number | null;
}

export class SurveyService {
  static async loadDemographicData(
    userId: string,
    teamId: string
  ): Promise<DemographicData | null> {
    try {
      const { data, error } = await supabase
        .from("demographic_data")
        .select("*")
        .eq("user_id", userId)
        .eq("team_id", teamId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar dados demográficos:", error);
        return handleDataError(error);
      }

      return data;
    } catch (error) {
      console.error("Erro ao carregar dados demográficos:", error);
      return null;
    }
  }

  static async saveDemographicData(
    userId: string,
    teamId: string,
    data: DemographicFormValues
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("demographic_data").upsert({
        user_id: userId,
        team_id: teamId,
        ...data,
        updated_at: new Date().toISOString(),
      });

      if (error) return handleBooleanError(error);
      return true;
    } catch (error) {
      console.error("Erro ao salvar dados demográficos:", error);
      return false;
    }
  }

  static async loadSurveyResponses(
    userId: string,
    teamId: string
  ): Promise<SurveyResponse | null> {
    try {
      // Tentar primeiro pelo user_id diretamente
      const { data, error } = await supabase
        .from("survey_responses")
        .select("*")
        .eq("user_id", userId)
        .eq("team_id", teamId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar respostas:", error);
        return handleDataError(error);
      }

      // Se encontrou, retornar as respostas
      if (data) {
        console.log("Respostas encontradas pelo user_id:", data);
        return this.formatSurveyResponse(data);
      }

      // Se não encontrou pelo user_id, tentar buscar pelo email
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("email")
        .eq("auth_id", userId)
        .maybeSingle();

      if (!userProfile?.email) {
        console.log("Email do usuário não encontrado");
        return null;
      }

      // Buscar membro da equipe pelo email
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("*")
        .eq("email", userProfile.email)
        .eq("team_id", teamId)
        .maybeSingle();

      if (!teamMember) {
        console.log("Membro da equipe não encontrado");
        return null;
      }

      console.log("Membro da equipe encontrado:", teamMember);

      // Buscar respostas baseadas no user_id do membro (se existir)
      if (teamMember.user_id) {
        const { data: memberResponses } = await supabase
          .from("survey_responses")
          .select("*")
          .eq("user_id", teamMember.user_id)
          .eq("team_id", teamId)
          .maybeSingle();

        if (memberResponses) {
          console.log(
            "Respostas encontradas pelo user_id do membro:",
            memberResponses
          );
          return this.formatSurveyResponse(memberResponses);
        }
      }

      console.log("Nenhuma resposta encontrada para o usuário");
      return null;
    } catch (error) {
      console.error("Erro ao carregar respostas:", error);
      return null;
    }
  }

  static formatSurveyResponse(data: any): SurveyResponse {
    const responses: SurveyResponses = {};
    for (let i = 1; i <= 12; i++) {
      const key = `q${i}`;
      if (data[key] !== null) {
        responses[key] = data[key];
      }
    }

    return {
      id: data.id,
      user_id: data.user_id,
      team_id: data.team_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_complete: data.is_complete,
      responses,
    };
  }

  static async saveSurveyResponses(
    userId: string,
    teamId: string,
    responses: SurveyResponses
  ): Promise<boolean> {
    try {
      // Verificar se todas as 12 questões foram respondidas
      const isComplete = Array.from(
        { length: 12 },
        (_, i) => `q${i + 1}`
      ).every((q) => responses[q] !== undefined && responses[q] !== null);

      const dbResponses = {
        user_id: userId,
        team_id: teamId,
        updated_at: new Date().toISOString(),
        is_complete: isComplete,
        ...responses,
      };

      const { error } = await supabase
        .from("survey_responses")
        .upsert(dbResponses, {
          onConflict: "user_id,team_id",
        });

      if (error) return handleBooleanError(error);

      // Se salvou com sucesso e está completo, atualizar o status do membro
      if (isComplete) {
        await this.updateMemberStatus(userId, "answered");
      }

      return true;
    } catch (error) {
      console.error("Erro ao salvar respostas:", error);
      return false;
    }
  }

  static async loadOpenQuestions(
    userId: string,
    teamId: string
  ): Promise<OpenQuestionResponse | null> {
    try {
      const { data, error } = await supabase
        .from("open_question_responses")
        .select("*")
        .eq("user_id", userId)
        .eq("team_id", teamId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar perguntas abertas:", error);
        return handleDataError(error);
      }

      return data;
    } catch (error) {
      console.error("Erro ao carregar perguntas abertas:", error);
      return null;
    }
  }

  static async saveOpenQuestions(
    userId: string,
    teamId: string,
    answers: OpenQuestionsFormValues
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("open_question_responses").upsert({
        user_id: userId,
        team_id: teamId,
        ...answers,
        updated_at: new Date().toISOString(),
      });

      if (error) return handleBooleanError(error);
      return true;
    } catch (error) {
      console.error("Erro ao salvar perguntas abertas:", error);
      return false;
    }
  }

  static async getMemberStatus(
    teamMemberId: string
  ): Promise<TeamMemberStatus | null> {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("status")
        .eq("id", teamMemberId)
        .single();

      if (error) return handleDataError(error);
      return data?.status || null;
    } catch (error) {
      console.error("Erro ao obter status do membro:", error);
      return null;
    }
  }

  static async updateMemberStatus(
    teamMemberId: string,
    status: TeamMemberStatus
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("team_members")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", teamMemberId);

      if (error) return handleBooleanError(error);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status do membro:", error);
      return false;
    }
  }

  static async checkSurveyCompletion(
    userId: string,
    teamId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("survey_responses")
        .select("is_complete")
        .eq("user_id", userId)
        .eq("team_id", teamId)
        .single();

      if (error) return handleBooleanError(error);
      return data?.is_complete || false;
    } catch (error) {
      console.error("Erro ao verificar conclusão do questionário:", error);
      return false;
    }
  }

  static getCompetencyName(questionId: string): string {
    const competencies: Record<string, string> = {
      q1: "Abertura",
      q2: "Agilidade",
      q3: "Confiança",
      q4: "Empatia",
      q5: "Articulação",
      q6: "Adaptabilidade",
      q7: "Inovação",
      q8: "Comunicação",
      q9: "Descentralização",
      q10: "Auto-organização",
      q11: "Colaboração",
      q12: "Resiliência",
    };

    return competencies[questionId] || questionId;
  }

  static async getTeamResults(teamId: string) {
    try {
      // Buscar todos os membros da equipe com seus emails e papéis
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("id, role, user_id, email")
        .eq("team_id", teamId);

      if (membersError) throw membersError;
      if (!members?.length) return null;

      console.log("Total de membros encontrados:", members.length);

      // Criar um mapa de emails e user_ids para facilitar a associação
      const emailToMember = new Map();
      const userIdToMember = new Map();

      for (const member of members) {
        emailToMember.set(member.email, member);
        if (member.user_id) {
          userIdToMember.set(member.user_id, member);
        }
      }

      // Buscar todas as respostas para este time
      const { data: responses, error: responsesError } = await supabase
        .from("survey_responses")
        .select("*")
        .eq("team_id", teamId);

      if (responsesError) {
        console.error("Erro ao buscar respostas:", responsesError);
        return null;
      }

      console.log("Respostas encontradas:", responses?.length || 0);

      // Definir IDs das questões
      const questionIds = Array.from(
        { length: 12 },
        (_, i) => `q${i + 1}` as keyof SurveyResponseData
      );

      // Associar respostas aos membros
      const memberResponses: Record<string, any>[] = [];
      const leaderResponses: Record<string, any>[] = [];

      // Processar as respostas encontradas
      if (responses && responses.length > 0) {
        for (const response of responses) {
          // Tentar encontrar o membro correspondente por user_id
          let member = userIdToMember.get(response.user_id);

          // Buscar o email do usuário se não encontrou o membro
          if (!member && response.user_id) {
            const { data: userProfile } = await supabase
              .from("user_profiles")
              .select("email")
              .eq("auth_id", response.user_id)
              .maybeSingle();

            if (userProfile?.email) {
              member = emailToMember.get(userProfile.email);
            }
          }

          // Adicionar à lista correta com base no papel do membro
          if (member) {
            if (member.role === "leader") {
              leaderResponses.push({ ...response, role: "leader" });
            } else {
              memberResponses.push({ ...response, role: "member" });
            }
          } else {
            // Se não conseguiu associar, tentar descobrir o papel de outra forma
            console.log(
              "Não foi possível associar a resposta a um membro:",
              response
            );
            memberResponses.push({ ...response, role: "member" }); // Assumir membro regular por padrão
          }
        }
      }

      console.log("Respostas processadas:", {
        membros: memberResponses.length,
        líderes: leaderResponses.length,
      });

      // Calcular média da equipe (apenas membros regulares)
      const teamAverage = questionIds.map((questionId) => {
        const values = memberResponses
          .map((member) => member[questionId])
          .filter(
            (value): value is number =>
              value !== undefined && value !== null && value !== 0
          );

        const average = values.length
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : 0;

        return {
          questionId,
          average: Number(average.toFixed(2)),
          memberCount: values.length,
        };
      });

      // Usar a primeira resposta do líder ou criar uma resposta vazia
      let leaderResponse =
        leaderResponses.length > 0 ? leaderResponses[0] : null;

      // Se não há respostas do líder, criar valores zerados
      if (!leaderResponse) {
        // Procurar o líder nos membros da equipe
        const leader = members.find((m) => m.role === "leader");
        if (leader) {
          leaderResponse = {
            user_id: leader.user_id,
            team_id: teamId,
            role: "leader",
            ...Object.fromEntries(questionIds.map((q) => [q, 0])),
          };
        } else {
          leaderResponse = {
            team_id: teamId,
            role: "leader",
            ...Object.fromEntries(questionIds.map((q) => [q, 0])),
          };
        }
      }

      // Formatar respostas do líder
      const formattedLeaderResponses = questionIds.map((questionId) => ({
        questionId,
        value: Number(leaderResponse[questionId] || 0),
      }));

      return {
        teamAverage,
        leaderResponses: formattedLeaderResponses,
      };
    } catch (error) {
      console.error("Erro ao carregar resultados da equipe:", error);
      return null;
    }
  }

  static async getCompetencyComparison(
    teamId: string
  ): Promise<CompetencyComparison[]> {
    try {
      const { data, error } = await supabase
        .from("competency_comparison")
        .select("*")
        .eq("team_id", teamId);

      if (error) {
        console.error("Erro ao buscar comparação de competências:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Erro ao carregar comparação de competências:", error);
      return [];
    }
  }
}
