"use client";

import { OrgLayout } from "@/components/organization/org-layout";
import { TeamOverviewCard } from "@/components/organization/team-overview-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOrganization } from "@/resources/organization/organization-hook";
import { BarChart2, MessagesSquare, PlusCircle, Users2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect } from "react";

export default function OrgDashboardPage() {
  const {
    selectedOrganization,
    organizations,
    teamOverviews,
    getTeamOverviews,
    selectOrganization,
    isLoading,
  } = useOrganization();

  // Selecionar a primeira organização se nenhuma estiver selecionada
  useEffect(() => {
    if (!selectedOrganization && organizations.length > 0) {
      selectOrganization(organizations[0]);
    }
  }, [selectedOrganization, organizations, selectOrganization]);

  // Carregar dados da equipe quando a organização for selecionada
  useEffect(() => {
    if (selectedOrganization) {
      getTeamOverviews(selectedOrganization.id);
    }
  }, [selectedOrganization, getTeamOverviews]);

  const getTotalMembers = useCallback(() => {
    return teamOverviews.reduce((total, team) => total + team.total_members, 0);
  }, [teamOverviews]);

  const getRespondedMembers = useCallback(() => {
    return teamOverviews.reduce(
      (total, team) => total + team.members_answered,
      0
    );
  }, [teamOverviews]);

  const getCompletionPercentage = useCallback(() => {
    const total = getTotalMembers();
    const responded = getRespondedMembers();
    if (total === 0) return 0;
    return Math.round((responded / total) * 100);
  }, [getTotalMembers, getRespondedMembers]);

  return (
    <OrgLayout>
      <div className="container py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral da organização{" "}
              {selectedOrganization ? selectedOrganization.name : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/org/teams/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Equipe
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/org/leaders/invite">
                <Users2 className="mr-2 h-4 w-4" />
                Convidar Líderes
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Equipes</CardDescription>
              <CardTitle>{teamOverviews.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Equipes ativas na organização
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Membros</CardDescription>
              <CardTitle>{getTotalMembers()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Membros em todas as equipes
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Respostas Recebidas</CardDescription>
              <CardTitle>
                {getRespondedMembers()} / {getTotalMembers()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Taxa de resposta: {getCompletionPercentage()}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Equipes Concluídas</CardDescription>
              <CardTitle>
                {
                  teamOverviews.filter(
                    (team) =>
                      team.completion_percentage &&
                      team.completion_percentage >= 80
                  ).length
                }{" "}
                / {teamOverviews.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Equipes com mais de 80% de respostas
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Equipes</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/org/teams">Ver Todas</Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : teamOverviews.length === 0 ? (
            <Card className="flex h-40 flex-col items-center justify-center">
              <p className="mb-4 text-muted-foreground">
                Nenhuma equipe encontrada
              </p>
              <Button asChild>
                <Link href="/org/teams/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Equipe
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teamOverviews.slice(0, 6).map((team) => (
                <TeamOverviewCard key={team.team_id} team={team} />
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5" />
                Resumo de Resultados
              </CardTitle>
              <CardDescription>
                Visão geral dos resultados da organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-40 items-center justify-center">
                <Link href="/org/results" passHref>
                  <Button>Ver Resultados Detalhados</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessagesSquare className="mr-2 h-5 w-5" />
                Respostas Abertas
              </CardTitle>
              <CardDescription>Insights das perguntas abertas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-40 items-center justify-center">
                <Link href="/org/open-answers" passHref>
                  <Button>Ver Respostas Abertas</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </OrgLayout>
  );
}
