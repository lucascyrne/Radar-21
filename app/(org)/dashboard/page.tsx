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
import { useAuth } from "@/resources/auth/auth-hook";
import { useOrganization } from "@/resources/organization/organization-hook";
import { useTeam } from "@/resources/team/team-hook";
import { BarChart2, MessagesSquare, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function OrgDashboardPage() {
  const { user } = useAuth();
  const { selectedOrganization } = useOrganization();
  const { teams, teamMembers, loadTeams, isLoading } = useTeam();

  // Estado para controlar a montagem do componente
  const [isMounted, setIsMounted] = useState(false);
  const [teamOverviews, setTeamOverviews] = useState<any[]>([]);

  // Efeito para marcar o componente como montado no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Carregar times do usuário quando o componente montar
  useEffect(() => {
    if (isMounted && user?.id) {
      loadTeams(user.id);
    }
  }, [isMounted, user?.id]);

  // Preparar dados das equipes para exibição
  useEffect(() => {
    if (teams.length > 0) {
      // Criar uma visualização simplificada dos times para o dashboard
      const overviews = teams.map((team) => {
        // Buscar membros da equipe atual
        const members = teamMembers.filter((m) => m.team_id === team.id);
        const totalMembers = members.length || team.team_size || 0;
        const respondedMembers = members.filter(
          (m) => m.status === "answered"
        ).length;
        const completionPercentage =
          totalMembers > 0
            ? Math.round((respondedMembers / totalMembers) * 100)
            : 0;

        return {
          team_id: team.id,
          team_name: team.name,
          organization_id: selectedOrganization?.id || "",
          organization_name: selectedOrganization?.name || "",
          members_answered: respondedMembers,
          total_members: totalMembers,
          team_created_at: team.created_at,
          leaders_answered: 0,
          total_leaders: 0,
          completion_percentage: completionPercentage,
        };
      });

      setTeamOverviews(overviews);
    }
  }, [teams, teamMembers, selectedOrganization]);

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
  }, []);

  // Não renderizar conteúdo no primeiro render para evitar hidratação inconsistente
  if (!isMounted) {
    return (
      <OrgLayout>
        <div className="container py-8">Carregando...</div>
      </OrgLayout>
    );
  }

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
              <Link href="/teams/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Equipe
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
              <Link href="/teams">Ver Todas</Link>
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
                <Link href="/teams/add">
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
                <Link href="/org-results" passHref>
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
                <Link href="/open-answers" passHref>
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
