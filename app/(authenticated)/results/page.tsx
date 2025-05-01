"use client";

import { Layout } from "@/components/layout";
import { CompetencyBadge } from "@/components/survey/competency-badge";
import { OpenQuestionsResults } from "@/components/survey/open-questions-results";
import { RadarChart } from "@/components/survey/radar-chart";
import { ResultsTable } from "@/components/survey/results-table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

        // Carregar respostas do survey via team service
        const teamResponses = await loadTeamSurveyResponses(teamId);

        if (!teamResponses || teamResponses.length === 0) {
          console.warn("Não foi possível encontrar respostas da equipe");
          return;
        }

        console.log("Respostas da equipe obtidas:", teamResponses);
        processTeamResponses(teamResponses);
      } catch (error) {
        console.error("Erro ao carregar resultados:", error);
        toast.error("Não foi possível carregar os resultados da equipe.");
      }
    };

    // Função para processar respostas da equipe
    const processTeamResponses = (responses: any[]) => {
      if (!responses || responses.length === 0) return;

      console.log("Processando respostas brutas:", responses);

      // Separar respostas do líder e membros da equipe
      const leaderResponses = responses.filter(
        (member) => member.role === "leader"
      );

      console.log("Respostas de líderes encontradas:", leaderResponses.length);

      // Pegar apenas a primeira resposta do líder, se houver mais de uma
      const leaderResponse =
        leaderResponses.length > 0 ? leaderResponses[0] : null;

      // Garantir que apenas membros regulares, não líderes, sejam considerados para a média da equipe
      const teamMemberResponses = responses.filter(
        (member) => member.role === "member"
      );

      console.log("Processando dados:", {
        total: responses.length,
        leaderCount: leaderResponses.length,
        leaderResponse: leaderResponse ? "Disponível" : "Não disponível",
        membersCount: teamMemberResponses.length,
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
            member[questionId] !== undefined &&
            member[questionId] !== null &&
            member[questionId] !== 0
        );

        if (validResponses.length === 0) {
          console.warn(`Nenhuma resposta válida para a questão ${questionId}`);
          return {
            questionId,
            average: 0,
            memberCount: 0,
          };
        }

        const sum = validResponses.reduce(
          (acc, member) => acc + (parseFloat(member[questionId]) || 0),
          0
        );

        const average = sum / validResponses.length;

        console.log(
          `Questão ${questionId}: média ${average} (${validResponses.length} respostas)`
        );

        return {
          questionId,
          average: Number(average.toFixed(1)),
          memberCount: validResponses.length,
        };
      });

      console.log(
        `Calculadas médias para ${teamAverages.length} questões da equipe.`
      );

      // Definir resultados da equipe
      setTeamResults(
        teamAverages.map((item) => ({
          category: SurveyService.getCompetencyName(item.questionId),
          value: item.average,
        }))
      );

      // Definir resultados do líder se disponível
      if (leaderResponse) {
        console.log("Respostas do líder:", leaderResponse);

        const leaderDataPoints = questionIds.map((key) => ({
          category: SurveyService.getCompetencyName(key),
          value: Number(leaderResponse[key] || 0),
        }));

        console.log(`Obtidas ${leaderDataPoints.length} respostas do líder.`);
        console.log("Dados do líder:", leaderDataPoints);

        if (leaderDataPoints.length > 0) {
          setLeaderResults(leaderDataPoints);
        } else {
          console.warn("Líder não tem respostas válidas");
          setLeaderResults([]);
        }
      } else {
        console.warn("Resposta do líder não disponível");
        // Criar valores vazios para o líder (zeros)
        const emptyLeaderResults = questionIds.map((key) => ({
          category: SurveyService.getCompetencyName(key),
          value: 0,
        }));
        setLeaderResults(emptyLeaderResults);
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
                    <div className="text-sm text-muted-foreground mb-4">
                      Este gráfico mostra a comparação entre sua avaliação, a
                      média da equipe (excluindo o líder) e a avaliação da
                      liderança. A diferença entre a média da equipe e a
                      avaliação da liderança é especialmente importante para
                      identificar pontos de convergência e divergência.
                    </div>
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
                    <div className="text-sm text-muted-foreground mb-4">
                      Esta tabela compara sua avaliação com a média da equipe
                      (excluindo o líder) e a avaliação da liderança. Valores
                      positivos na coluna de diferença indicam que a equipe
                      avalia a competência mais positivamente que o líder.
                    </div>
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
