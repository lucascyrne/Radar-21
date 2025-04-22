import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Team } from "@/resources/team/team-model";
import { BarChart2, Eye, Users } from "lucide-react";
import Link from "next/link";
import { TeamStatus } from "./team-status";

interface TeamListProps {
  teams: Team[];
  totalMembers: Record<string, number>;
  completionPercentages: Record<string, number>;
  userEmail: string;
  onSelectTeam: (teamId: string) => void;
  selectedTeamId?: string;
}

export function TeamList({
  teams,
  totalMembers,
  completionPercentages,
  userEmail,
  onSelectTeam,
  selectedTeamId,
}: TeamListProps) {
  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma equipe encontrada.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => {
        const memberCount = totalMembers[team.id] || team.team_size || 0;
        const completionPercentage = completionPercentages[team.id] || 0;

        // Determinar o status da equipe
        const teamStatus =
          completionPercentage >= 80
            ? "completo"
            : completionPercentage > 0
            ? "em-progresso"
            : "pendente";

        return (
          <Card
            key={team.id}
            className={`flex flex-col ${
              selectedTeamId === team.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelectTeam(team.id)}
            style={{ cursor: "pointer" }}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{team.name}</CardTitle>
                <TeamStatus status={teamStatus} />
              </div>
              <CardDescription>
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{memberCount} membros</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 pt-2 flex-grow">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso</span>
                  <span className="font-medium">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="grid grid-rows-2 gap-2 pt-0">
              <Button variant="outline" asChild className="w-full">
                <Link href={`/teams/${team.id}`}>
                  <Eye className="mr-1 h-4 w-4" />
                  Detalhes
                </Link>
              </Button>
              <Button variant="secondary" asChild className="w-full">
                <Link href={`/teams/${team.id}/results`}>
                  <BarChart2 className="mr-1 h-4 w-4" />
                  Resultados
                </Link>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
