"use client";

import { Badge } from "@/components/ui/badge";
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
import { BarChart2, Users } from "lucide-react";
import Link from "next/link";

interface TeamOverviewCardProps {
  team: OrganizationTeamOverview;
}

export function TeamOverviewCard({ team }: TeamOverviewCardProps) {
  const formattedDate = team.team_created_at
    ? format(new Date(team.team_created_at), "dd/MM/yyyy")
    : "Data desconhecida";

  const progressColor =
    team.completion_percentage && team.completion_percentage >= 80
      ? "text-green-500"
      : team.completion_percentage && team.completion_percentage >= 50
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">{team.team_name}</CardTitle>
        <CardDescription>Criada em: {formattedDate}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Progresso da equipe
            </span>
            <Badge
              variant={
                team.completion_percentage && team.completion_percentage >= 80
                  ? "default"
                  : team.completion_percentage &&
                    team.completion_percentage >= 50
                  ? "default"
                  : "destructive"
              }
            >
              {team.completion_percentage || 0}%
            </Badge>
          </div>
          <Progress
            value={team.completion_percentage || 0}
            className="h-2"
            indicatorClassName={
              team.completion_percentage && team.completion_percentage >= 80
                ? "bg-green-500"
                : team.completion_percentage && team.completion_percentage >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Membros</span>
            <span className="flex items-center font-medium">
              <Users className="mr-1 h-4 w-4 text-primary" />
              {team.members_answered} / {team.total_members}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Líderes</span>
            <span className="flex items-center font-medium">
              <Users className="mr-1 h-4 w-4 text-primary" />
              {team.leaders_answered} / {team.total_leaders}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/org/teams/${team.team_id}`}>Detalhes</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href={`/org/teams/${team.team_id}/results`}>
            <BarChart2 className="mr-2 h-4 w-4" />
            Resultados
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
