"use client";

import { OrgLayout } from "@/components/organization/org-layout";
import InviteUserForm from "@/components/team/invite-user-form";
import { TeamMembersDetail } from "@/components/team/team-members-detail";
import { TeamStatus } from "@/components/team/team-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/resources/auth/auth-hook";
import { useTeam } from "@/resources/team/team-hook";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TeamDetailsPage({
  params: { teamId },
}: {
  params: { teamId: string };
}) {
  const { user } = useAuth();
  const { teams, loadTeams, teamMembers, loadTeamMembers } = useTeam();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user?.id) return;

    setIsLoading(true);
    loadTeams(user.id)
      .then(() => loadTeamMembers(teamId))
      .catch((error) => {
        console.error("Erro ao carregar informações da equipe:", error);
        toast.error("Erro ao carregar informações da equipe");
      })
      .finally(() => setIsLoading(false));
  }, [teamId, user?.id]);

  const team = teams.find((t) => t.id === teamId);

  if (isLoading) {
    return (
      <OrgLayout>
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-100 rounded"></div>
              <div className="h-64 bg-gray-100 rounded"></div>
            </div>
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

  const completionRatio =
    teamMembers.length > 0
      ? teamMembers.filter((m) => m.status === "answered").length /
        teamMembers.length
      : 0;
  const completionPercentage = Math.round(completionRatio * 100);
  const teamStatus =
    completionPercentage >= 80
      ? "completo"
      : completionPercentage > 0
      ? "em-progresso"
      : "pendente";

  return (
    <OrgLayout>
      <div className="container py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
              <Link href="/teams">
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Equipes</span>
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">
                {team.name}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{teamMembers.length} membros</span>
                </div>
                <TeamStatus status={teamStatus} />
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="invite">Convidar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status da Equipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Progresso da Equipe</span>
                      <span className="font-medium">
                        {completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {
                        teamMembers.filter((m) => m.status === "answered")
                          .length
                      }{" "}
                      de {teamMembers.length} membros responderam
                    </div>

                    <div className="mt-6 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">
                        Status da equipe
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {teamStatus === "completo"
                          ? "Equipe completa! Todos os membros responderam ao questionário."
                          : teamStatus === "em-progresso"
                          ? "Equipe em progresso. Alguns membros ainda precisam responder."
                          : "Equipe pendente. Nenhum membro respondeu ainda."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações da Equipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Nome da Equipe
                      </dt>
                      <dd className="text-base">{team.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Criada por
                      </dt>
                      <dd className="text-base">{team.owner_email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Data de Criação
                      </dt>
                      <dd className="text-base">
                        {new Date(team.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Tamanho da Equipe
                      </dt>
                      <dd className="text-base">{team.team_size} membros</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <TeamMembersDetail teamId={teamId} />
          </TabsContent>

          <TabsContent value="invite">
            <div className="max-w-2xl mx-auto">
              <InviteUserForm
                teamId={team.id}
                teamName={team.name}
                ownerEmail={team.owner_email}
                onInviteSent={() => loadTeamMembers(team.id)}
                existingMembers={teamMembers}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </OrgLayout>
  );
}
