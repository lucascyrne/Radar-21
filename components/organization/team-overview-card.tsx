"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { OrganizationTeamOverview } from "@/resources/organization/organization-model";
import { format } from "date-fns";
import { BarChart2, Users2 } from "lucide-react";
import Link from "next/link";

interface TeamOverviewCardProps {
  team: OrganizationTeamOverview;
  onClick?: () => void;
}

export function TeamOverviewCard({ team, onClick }: TeamOverviewCardProps) {
  const formattedDate = team.team_created_at
    ? format(new Date(team.team_created_at), "dd/MM/yyyy")
    : "Data desconhecida";

  const completionPercentage =
    team.total_members > 0
      ? Math.round((team.members_answered / team.total_members) * 100)
      : 0;

  const progressColor =
    completionPercentage >= 80 ? "text-green-500" : "text-red-500";

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{team.team_name}</span>
          <Users2 className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
        <CardDescription>Criada em: {formattedDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Membros</p>
            <p className="font-medium">
              {team.members_answered} / {team.total_members}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium">
              {completionPercentage >= 80 ? "Concluído" : "Em andamento"}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/teams/${team.team_id}`}>Detalhes</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href={`/teams/${team.team_id}/results`}>
            <BarChart2 className="mr-2 h-4 w-4" />
            Resultados
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
