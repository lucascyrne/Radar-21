"use client";

import { OrgLayout } from "@/components/organization/org-layout";
import { CompetencyCloud } from "@/components/team/competency-cloud";
import { TeamCompetencyDetails } from "@/components/team/team-competency-details";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/resources/auth/auth-hook";
import { useTeam } from "@/resources/team/team-hook";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TeamResultsPage({
  params: { teamId },
}: {
  params: { teamId: string };
}) {
  const { user } = useAuth();
  const {
    teams,
    loadTeams,
    teamMembers,
    loadTeamMembers,
    teamSurveyResponses,
    loadTeamSurveyResponses,
  } = useTeam();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user?.id) return;

    setIsLoading(true);

    const fetchData = async () => {
      try {
        await loadTeams(user.id);
        await loadTeamMembers(teamId);
        await loadTeamSurveyResponses(teamId);
      } catch (error) {
        console.error("Erro ao carregar dados de resultados:", error);
        toast.error("Erro ao carregar dados de resultados");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [teamId, user?.id]);

  const team = teams.find((t) => t.id === teamId);

  // Função para exportar dados como CSV
  const exportToCSV = () => {
    if (!teamSurveyResponses || teamSurveyResponses.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    // Cabeçalhos para o CSV
    const headers = [
      "Email",
      "Papel",
      "Q1",
      "Q2",
      "Q3",
      "Q4",
      "Q5",
      "Q6",
      "Q7",
      "Q8",
      "Q9",
      "Q10",
      "Q11",
      "Q12",
      "Data da Resposta",
    ];

    // Preparar linhas de dados
    const rows = teamSurveyResponses.map((response) => [
      response.email,
      response.role,
      response.q1 || "",
      response.q2 || "",
      response.q3 || "",
      response.q4 || "",
      response.q5 || "",
      response.q6 || "",
      response.q7 || "",
      response.q8 || "",
      response.q9 || "",
      response.q10 || "",
      response.q11 || "",
      response.q12 || "",
      response.response_created_at
        ? new Date(response.response_created_at).toLocaleDateString()
        : "",
    ]);

    // Combinar cabeçalhos e linhas
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${team?.name || "equipe"}_resultados.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <OrgLayout>
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-8"></div>
            <div className="h-96 bg-gray-100 rounded"></div>
          </div>
        </div>
      </OrgLayout>
    );
  }

  if (!team) {
    return (
      <OrgLayout>
        <div className="container py-8">
          <div className="max-w-lg mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Equipe não encontrada</h1>
            <p className="text-muted-foreground mb-6">
              A equipe que você está procurando não existe ou você não tem
              permissão para acessá-la.
            </p>
            <Button asChild>
              <Link href="/teams">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Equipes
              </Link>
            </Button>
          </div>
        </div>
      </OrgLayout>
    );
  }

  const hasResponses = teamSurveyResponses.length > 0;

  // Verificar quantos membros responderam
  const respondedMembersCount = teamMembers.filter(
    (m) => m.status === "answered"
  ).length;

  return (
    <OrgLayout>
      <div className="container py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
              <Link href={`/teams/${teamId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Voltar para Equipe</span>
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">
                Resultados: {team.name}
              </h1>
              <p className="text-muted-foreground">
                Análise das competências da equipe com base nas respostas dos
                membros
              </p>
            </div>
            <Button
              onClick={exportToCSV}
              disabled={!hasResponses}
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Resultados
            </Button>
          </div>
        </div>

        {!hasResponses ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">
                  Sem respostas disponíveis
                </p>
                <p className="text-muted-foreground mb-6">
                  Os membros da equipe ainda não responderam ao questionário.
                </p>
                <Button asChild>
                  <Link href={`/teams/${teamId}`}>Ver Detalhes da Equipe</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="competencies">Competências</TabsTrigger>
              <TabsTrigger value="responses">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo dos Resultados</CardTitle>
                  <CardDescription>
                    Visão geral das competências da equipe {team.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Membros</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-primary">
                            {respondedMembersCount}
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              respostas
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Média Geral</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-primary">
                            {(
                              teamSurveyResponses.reduce((acc, curr) => {
                                const scores = [
                                  curr.q1,
                                  curr.q2,
                                  curr.q3,
                                  curr.q4,
                                  curr.q5,
                                  curr.q6,
                                  curr.q7,
                                  curr.q8,
                                  curr.q9,
                                  curr.q10,
                                  curr.q11,
                                  curr.q12,
                                ].filter(
                                  (score) =>
                                    score !== null && score !== undefined
                                );
                                return (
                                  acc +
                                  scores.reduce(
                                    (sum, score) => sum + score,
                                    0
                                  ) /
                                    scores.length
                                );
                              }, 0) / teamSurveyResponses.length
                            ).toFixed(1)}
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              / 5
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-primary">
                            {Math.round(
                              (respondedMembersCount / teamMembers.length) * 100
                            )}
                            %
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              concluído
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <CompetencyCloud
                      competencies={Object.values(
                        teamSurveyResponses.reduce((acc, curr) => {
                          const competencies = [
                            { id: "q1", name: "Abertura", value: curr.q1 },
                            { id: "q2", name: "Agilidade", value: curr.q2 },
                            { id: "q3", name: "Confiança", value: curr.q3 },
                            { id: "q4", name: "Empatia", value: curr.q4 },
                            { id: "q5", name: "Articulação", value: curr.q5 },
                            {
                              id: "q6",
                              name: "Adaptabilidade",
                              value: curr.q6,
                            },
                            { id: "q7", name: "Inovação", value: curr.q7 },
                            { id: "q8", name: "Comunicação", value: curr.q8 },
                            {
                              id: "q9",
                              name: "Descentralização",
                              value: curr.q9,
                            },
                            {
                              id: "q10",
                              name: "Auto-organização",
                              value: curr.q10,
                            },
                            { id: "q11", name: "Colaboração", value: curr.q11 },
                            { id: "q12", name: "Resiliência", value: curr.q12 },
                          ];

                          competencies.forEach((comp) => {
                            if (!acc[comp.name]) {
                              acc[comp.name] = {
                                category: comp.name,
                                value: 0,
                                count: 0,
                              };
                            }
                            if (
                              comp.value !== null &&
                              comp.value !== undefined
                            ) {
                              acc[comp.name].value += comp.value;
                              acc[comp.name].count += 1;
                            }
                          });

                          return acc;
                        }, {} as Record<string, { category: string; value: number; count: number }>)
                      ).map((comp) => ({
                        category: comp.category,
                        value: Number((comp.value / comp.count).toFixed(1)),
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="competencies">
              <Card>
                <CardHeader>
                  <CardTitle>Análise Detalhada</CardTitle>
                  <CardDescription>
                    Comparação entre avaliação do líder e equipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TeamCompetencyDetails
                    teamResponses={teamSurveyResponses}
                    showDetailed={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="responses">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pontos Fortes</CardTitle>
                    <CardDescription>
                      Aspectos positivos identificados pela equipe
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamSurveyResponses
                        .filter((r) => r.leadership_strengths)
                        .map((response, index) => (
                          <blockquote
                            key={`strength-${index}`}
                            className="border-l-4 border-primary pl-4 py-2 italic text-muted-foreground"
                          >
                            "{response.leadership_strengths}"
                          </blockquote>
                        ))}
                      {!teamSurveyResponses.some(
                        (r) => r.leadership_strengths
                      ) && (
                        <p className="text-muted-foreground">
                          Nenhuma resposta disponível.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Oportunidades</CardTitle>
                    <CardDescription>
                      Pontos de melhoria identificados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamSurveyResponses
                        .filter((r) => r.leadership_improvements)
                        .map((response, index) => (
                          <blockquote
                            key={`improvement-${index}`}
                            className="border-l-4 border-amber-500 pl-4 py-2 italic text-muted-foreground"
                          >
                            "{response.leadership_improvements}"
                          </blockquote>
                        ))}
                      {!teamSurveyResponses.some(
                        (r) => r.leadership_improvements
                      ) && (
                        <p className="text-muted-foreground">
                          Nenhuma resposta disponível.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </OrgLayout>
  );
}
