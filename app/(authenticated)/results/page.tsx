"use client";

import { Layout } from "@/components/layout";
import { CompetencyBadge } from "@/components/survey/competency-badge";
import { OpenQuestionsResults } from "@/components/survey/open-questions-results";
import { RadarChart } from "@/components/survey/radar-chart";
import { ResultsTable } from "@/components/survey/results-table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import supabase from "@/lib/supabase/client";
import { useAuth } from "@/resources/auth/auth-hook";
import { useSurvey } from "@/resources/survey/survey-hook";
import {
  RadarDataPoint,
  SurveyResponses,
} from "@/resources/survey/survey-model";
import { SurveyService } from "@/resources/survey/survey.service";
import { useTeam } from "@/resources/team/team-hook";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const competencyDescriptions: Record<string, string> = {
  Abertura:
    "Facilidade em dar e receber feedback construtivo entre líder e equipe.",
  Agilidade:
    "Capacidade de agir e reagir rapidamente, assumir riscos, experimentar e aprender com falhas.",
  Confiança:
    "Crença na existência de uma relação profissional baseada na confiança mútua entre líder e equipe.",
  Empatia:
    "Compreensão e consideração pela perspectiva e sentimentos dos outros em relações profissionais.",
  Articulação:
    "Potencialização e utilização eficaz das conexões entre competências internas e externas à equipe.",
  Adaptabilidade:
    "Capacidade de se adaptar rapidamente e responder a adversidades em situações não planejadas.",
  Inovação:
    "Ambiente que favorece, estimula e desenvolve a busca por inovação nos indivíduos.",
  Comunicação:
    "Comunicação facilitada e fluida, interna e externamente, através de diversos canais.",
  Descentralização:
    "Tomada de decisão participativa e compartilhada entre gestão e equipe.",
  "Auto-organização":
    "Capacidade da equipe de se auto-organizar para resolver tarefas complexas ou desafios inesperados.",
  Colaboração:
    "Tratamento colaborativo de desafios, aproveitando as competências individuais da equipe.",
  Resiliência:
    "Manutenção de uma atitude positiva, proativa e de aprendizado diante de obstáculos e fracassos.",
};

export default function ResultsPage() {
  const { user } = useAuth();
  const { selectedTeam } = useTeam();
  const { surveyResponses, answers, openQuestions, loading } = useSurvey();
  const { loadTeamSurveyResponses } = useTeam();
  const [userResults, setUserResults] = useState<RadarDataPoint[]>([]);
  const [teamResults, setTeamResults] = useState<RadarDataPoint[]>([]);
  const [leaderResults, setLeaderResults] = useState<RadarDataPoint[]>([]);
  const [userResponses, setUserResponses] = useState<SurveyResponses | null>(
    null
  );

  // Efeito para carregar respostas do usuário
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const teamId = selectedTeam?.id || localStorage.getItem("teamId");
        const userId = user?.id;

        if (!userId || !teamId) {
          console.error("IDs necessários não encontrados:", { userId, teamId });
          return;
        }

        // Se temos respostas do usuário diretamente, vamos usá-las
        if (answers) {
          setUserResponses(answers);
        } else if (surveyResponses) {
          setUserResponses(surveyResponses);
        } else {
          // Tentar carregar respostas do usuário diretamente do serviço
          const responses = await SurveyService.loadSurveyResponses(
            userId,
            teamId
          );
          if (responses) {
            setUserResponses(responses.responses);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar respostas:", error);
        toast.error("Não foi possível carregar suas respostas.");
      }
    };

    loadUserData();
  }, [user?.id, selectedTeam?.id, answers, surveyResponses]);

  // Processar respostas do usuário quando disponíveis
  useEffect(() => {
    const processUserResponses = () => {
      if (!userResponses) return;

      console.log("Processando respostas do usuário:", userResponses);

      // Transformar respostas do usuário para formato do radar
      const userDataPoints = Object.entries(userResponses)
        .filter(([key]) => key.startsWith("q"))
        .map(([key, value]) => ({
          category: SurveyService.getCompetencyName(key),
          value: Number(value),
        }));

      setUserResults(userDataPoints);
    };

    processUserResponses();
  }, [userResponses]);

  // Carregar dados da equipe e do líder
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        const teamId = selectedTeam?.id || localStorage.getItem("teamId");
        const userId = user?.id;

        if (!teamId || !userId) {
          console.error("IDs necessários não encontrados");
          return;
        }

        console.log("Carregando dados da equipe:", teamId);

        // Primeiro, buscar todas as respostas do survey
        const { data: surveyData, error: surveyError } = await supabase
          .from("survey_responses")
          .select("*")
          .eq("team_id", teamId)
          .eq("is_complete", true);

        if (surveyError) {
          console.error("Erro ao buscar respostas da pesquisa:", surveyError);
          throw surveyError;
        }

        console.log(
          "Respostas da pesquisa encontradas:",
          surveyData?.length || 0
        );

        if (!surveyData || surveyData.length === 0) {
          console.log(
            "Nenhuma resposta da pesquisa encontrada, tentando outro método"
          );

          // Tentativa alternativa: usar a função do contexto
          const teamResponses = await loadTeamSurveyResponses(teamId);

          if (!teamResponses || teamResponses.length === 0) {
            console.warn("Não foi possível encontrar respostas da equipe");
            return;
          }

          processTeamResponses(teamResponses);
          return;
        }

        // Agora, buscar os papéis dos membros da equipe
        const { data: teamMembers, error: teamMembersError } = await supabase
          .from("team_members")
          .select("user_id, role")
          .eq("team_id", teamId);

        if (teamMembersError) {
          console.error("Erro ao buscar membros da equipe:", teamMembersError);
          throw teamMembersError;
        }

        // Criar um mapa de user_id para role
        const roleMap = new Map(
          teamMembers.map((member) => [member.user_id, member.role])
        );

        // Transformar os dados para o formato esperado
        const processedResponses = surveyData.map((item: any) => {
          const role = roleMap.get(item.user_id) || "member";

          // Extrair apenas as respostas às questões (q1-q12)
          const responses: Record<string, number> = {};
          for (let i = 1; i <= 12; i++) {
            const key = `q${i}`;
            if (item[key] !== null && item[key] !== undefined) {
              responses[key] = item[key];
            }
          }

          return {
            id: item.id,
            user_id: item.user_id,
            team_id: item.team_id,
            role: role,
            ...responses,
          };
        });

        console.log("Respostas processadas:", processedResponses);

        // Verificar detalhes das respostas processadas
        const leaderCount = processedResponses.filter(
          (r) => r.role === "leader"
        ).length;
        const memberCount = processedResponses.filter(
          (r) => r.role === "member"
        ).length;

        console.log("Detalhes das respostas processadas:", {
          total: processedResponses.length,
          leaders: leaderCount,
          members: memberCount,
        });

        processTeamResponses(processedResponses);
      } catch (error) {
        console.error("Erro ao carregar resultados:", error);
        toast.error("Não foi possível carregar os resultados da equipe.");
      }
    };

    // Função para processar respostas da equipe
    const processTeamResponses = (responses: any[]) => {
      if (!responses || responses.length === 0) return;

      // Separar respostas do líder e membros da equipe
      const leaderResponses = responses.filter(
        (member) => member.role === "leader"
      );

      // Pegar apenas a primeira resposta do líder, se houver mais de uma
      const leaderResponse =
        leaderResponses.length > 0 ? leaderResponses[0] : null;

      // Garantir que apenas membros regulares, não líderes, sejam considerados para a média da equipe
      const teamMemberResponses = responses.filter(
        (member) => member.role === "member"
      );

      console.log("Respostas separadas:", {
        leaderCount: leaderResponses.length,
        leader: leaderResponse,
        teamMembers: teamMemberResponses.length,
      });

      if (teamMemberResponses.length === 0) {
        console.warn("Nenhum membro regular da equipe encontrado");
      }

      // Calcular média da equipe (apenas membros regulares, excluindo explicitamente o líder)
      const questionIds = [];
      for (let i = 1; i <= 12; i++) {
        questionIds.push(`q${i}`);
      }

      const teamAverages = questionIds.map((questionId) => {
        // Filtrar apenas membros regulares (não líderes) que responderam esta questão
        const validResponses = teamMemberResponses.filter(
          (member) =>
            member.role === "member" &&
            member[questionId] !== undefined &&
            member[questionId] !== null
        );

        // Debug para validar que nenhum líder está sendo incluído
        const userIds = validResponses.map((r) => r.user_id);
        if (validResponses.some((r) => r.role !== "member")) {
          console.error(
            "ERRO: Líderes incluídos no cálculo da média da equipe",
            validResponses.filter((r) => r.role !== "member")
          );
        }

        const sum = validResponses.reduce(
          (acc, member) => acc + (member[questionId] || 0),
          0
        );

        const average =
          validResponses.length > 0 ? sum / validResponses.length : 0;

        return {
          questionId,
          average: Number(average.toFixed(1)),
          memberCount: validResponses.length,
        };
      });

      console.log("Médias calculadas (excluindo o líder):", teamAverages);

      // Definir resultados da equipe
      setTeamResults(
        teamAverages.map((item) => ({
          category: SurveyService.getCompetencyName(item.questionId),
          value: item.average,
        }))
      );

      // Definir resultados do líder se disponível
      if (leaderResponse) {
        const leaderDataPoints = questionIds
          .filter(
            (key) =>
              leaderResponse[key] !== undefined && leaderResponse[key] !== null
          )
          .map((key) => ({
            category: SurveyService.getCompetencyName(key),
            value: Number(leaderResponse[key]),
          }));

        console.log("Dados do líder:", leaderDataPoints);
        setLeaderResults(leaderDataPoints);
      }
    };

    if (selectedTeam?.id && user?.id) {
      loadTeamData();
    }
  }, [selectedTeam?.id, user?.id]);

  // Determinar estado de carregamento usando o contexto
  const isPageLoading =
    loading.survey ||
    loading.openQuestions ||
    loading.demographicData ||
    loading.teamMember;

  // Verificar se temos dados para exibir
  const hasUserData = userResults.length > 0;

  console.log("Estado atual dos dados:", {
    hasUserData,
    teamResults,
    leaderResults,
    openQuestions,
    isPageLoading,
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Resultados da Avaliação
          </h1>
          <p className="text-muted-foreground">
            Visualize seus resultados e compare com a média da equipe e a
            avaliação da liderança.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex justify-center w-full">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="competencies">Competências</TabsTrigger>
              <TabsTrigger value="open-questions">Respostas</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {isPageLoading || !hasUserData ? (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Gráfico Radar
                    </h2>
                    <div className="h-[400px]">
                      <Skeleton className="h-full w-full" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Tabela Comparativa
                    </h2>
                    <Skeleton className="h-[200px] w-full" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Gráfico Radar
                    </h2>
                    <RadarChart
                      userResults={userResults}
                      teamResults={teamResults}
                      leaderResults={leaderResults}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Tabela Comparativa
                    </h2>
                    <ResultsTable
                      userResults={userResults}
                      teamResults={teamResults}
                      leaderResults={leaderResults}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="competencies" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Detalhamento por Competência
                </h2>
                {isPageLoading || !hasUserData ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(12)].map((_, i) => (
                      <Skeleton key={i} className="h-[180px] w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userResults.map((result) => (
                      <CompetencyBadge
                        key={result.category}
                        competency={result.category}
                        description={competencyDescriptions[result.category]}
                        value={result.value}
                        teamValue={
                          teamResults?.find(
                            (t) => t.category === result.category
                          )?.value
                        }
                        leaderValue={
                          leaderResults?.find(
                            (l) => l.category === result.category
                          )?.value
                        }
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="open-questions">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Respostas Dissertativas
                </h2>
                {isPageLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[100px] w-full" />
                    <Skeleton className="h-[100px] w-full" />
                  </div>
                ) : openQuestions ? (
                  <OpenQuestionsResults data={openQuestions} />
                ) : (
                  <p className="text-muted-foreground">
                    Nenhuma resposta dissertativa encontrada.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
