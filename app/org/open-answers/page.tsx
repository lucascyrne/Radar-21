"use client";

import { OrgLayout } from "@/components/organization/org-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganization } from "@/resources/organization/organization-hook";
import { format } from "date-fns";
import { useEffect, useState } from "react";

export default function OrgOpenAnswersPage() {
  const {
    selectedOrganization,
    organizations,
    teamOverviews,
    openAnswers,
    getOpenAnswers,
    getTeamOverviews,
    selectOrganization,
    isLoading,
  } = useOrganization();

  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");

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

  // Carregar respostas abertas quando a organização for selecionada
  useEffect(() => {
    if (selectedOrganization) {
      if (selectedTeamId === "all") {
        getOpenAnswers(selectedOrganization.id);
      } else {
        getOpenAnswers(selectedOrganization.id, selectedTeamId);
      }
    }
  }, [selectedOrganization, selectedTeamId, getOpenAnswers]);

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value);
  };

  return (
    <OrgLayout>
      <div className="container py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Respostas Abertas
            </h1>
            <p className="text-muted-foreground">
              Visualize as respostas para as perguntas abertas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedTeamId} onValueChange={handleTeamChange}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Selecione uma equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as equipes</SelectItem>
                {teamOverviews.map((team) => (
                  <SelectItem key={team.team_id} value={team.team_id}>
                    {team.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedOrganization) {
                  if (selectedTeamId === "all") {
                    getOpenAnswers(selectedOrganization.id);
                  } else {
                    getOpenAnswers(selectedOrganization.id, selectedTeamId);
                  }
                }
              }}
            >
              Atualizar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="strengths">
          <TabsList className="mb-4">
            <TabsTrigger value="strengths">Pontos Fortes</TabsTrigger>
            <TabsTrigger value="improvements">Melhorias</TabsTrigger>
          </TabsList>

          <TabsContent value="strengths">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <div className="col-span-full flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : openAnswers.length === 0 ? (
                <div className="col-span-full flex h-40 items-center justify-center">
                  <p className="text-muted-foreground">
                    Nenhuma resposta encontrada
                  </p>
                </div>
              ) : (
                openAnswers
                  .filter((answer) => answer.leadership_strengths)
                  .map((answer) => (
                    <Card
                      key={`strengths-${answer.user_id}-${answer.team_id}`}
                      className="overflow-hidden"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {answer.email}
                        </CardTitle>
                        <CardDescription className="flex flex-col gap-1">
                          <span>Equipe: {answer.team_name}</span>
                          <span>
                            Data:{" "}
                            {format(
                              new Date(answer.response_date),
                              "dd/MM/yyyy"
                            )}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{answer.leadership_strengths}</p>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="improvements">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <div className="col-span-full flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : openAnswers.length === 0 ? (
                <div className="col-span-full flex h-40 items-center justify-center">
                  <p className="text-muted-foreground">
                    Nenhuma resposta encontrada
                  </p>
                </div>
              ) : (
                openAnswers
                  .filter((answer) => answer.leadership_improvements)
                  .map((answer) => (
                    <Card
                      key={`improvements-${answer.user_id}-${answer.team_id}`}
                      className="overflow-hidden"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {answer.email}
                        </CardTitle>
                        <CardDescription className="flex flex-col gap-1">
                          <span>Equipe: {answer.team_name}</span>
                          <span>
                            Data:{" "}
                            {format(
                              new Date(answer.response_date),
                              "dd/MM/yyyy"
                            )}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          {answer.leadership_improvements}
                        </p>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </OrgLayout>
  );
}
