"use client";

import { OrgLayout } from "@/components/organization/org-layout";
import { CompetencyCloud } from "@/components/team/competency-cloud";
import { TeamList } from "@/components/team/team-list";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/resources/auth/auth-hook";
import { useSurvey } from "@/resources/survey/survey-hook";
import { useTeam } from "@/resources/team/team-hook";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function TeamsPage() {
  const { user } = useAuth();
  const {
    teams,
    loadTeams,
    teamMembers,
    loadTeamMembers,
    isLoading: isTeamLoading,
  } = useTeam();
  const { getCompetencyComparison } = useSurvey();
  const [isLoading, setIsLoading] = useState(true);
  const [competencyData, setCompetencyData] = useState<
    Array<{ category: string; value: number }>
  >([]);
  const router = useRouter();

  const updateCompetencyData = async (teamId: string) => {
    const data = await getCompetencyComparison(teamId);
    // Transformar os dados para o formato esperado
    const transformed = data.map((comp) => ({
      category: comp.competency,
      value: comp.team_average,
    }));
    setCompetencyData(transformed);
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        await loadTeams(user.id);

        // Se temos times, carregar os membros de cada time em sequência
        if (teams.length > 0) {
          await Promise.all([
            ...teams.map((team) => loadTeamMembers(team.id)),
            // Carregar dados de competência para o primeiro time
            teams[0] && updateCompetencyData(teams[0].id),
          ]);
        }
      } catch (error) {
        console.error("Erro ao carregar equipes:", error);
        toast.error("Erro ao carregar equipes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Calcular contagem de membros e porcentagens de conclusão para cada equipe
  const { totalMembers, completionPercentages } = useMemo(() => {
    const members: Record<string, number> = {};
    const percentages: Record<string, number> = {};

    teams.forEach((team) => {
      const teamMembersList = teamMembers.filter((m) => m.team_id === team.id);
      members[team.id] = teamMembersList.length || team.team_size || 0;

      const answeredCount = teamMembersList.filter(
        (m) => m.status === "answered"
      ).length;
      percentages[team.id] =
        members[team.id] > 0
          ? Math.round((answeredCount / members[team.id]) * 100)
          : 0;
    });

    return { totalMembers: members, completionPercentages: percentages };
  }, [teams, teamMembers]);

  return (
    <OrgLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipes</h1>
            <p className="text-muted-foreground">
              Gerencie suas equipes e visualize seu progresso
            </p>
          </div>
          <Button asChild>
            <Link href="/teams/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Equipe
            </Link>
          </Button>
        </div>

        {isLoading || isTeamLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-100 rounded-md mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-1"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <TeamList
              teams={teams}
              totalMembers={totalMembers}
              completionPercentages={completionPercentages}
              userEmail={user?.email || ""}
              onSelectTeam={(teamId) => {
                router.push(`/teams/${teamId}`);
                updateCompetencyData(teamId);
              }}
            />
            {competencyData.length > 0 && (
              <div className="mt-8">
                <CompetencyCloud competencies={competencyData} />
              </div>
            )}
          </>
        )}
      </div>
    </OrgLayout>
  );
}
