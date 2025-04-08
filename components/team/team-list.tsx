import { useTeam } from "@/resources/team/team-hook";
import { Team } from "@/resources/team/team-model";
import { useCallback } from "react";

interface TeamListProps {
  teams: Team[];
  selectedTeamId: string | undefined;
  userEmail: string | null;
  onSelectTeam: (teamId: string) => void;
}

export function TeamList({
  teams,
  selectedTeamId,
  userEmail,
  onSelectTeam,
}: TeamListProps) {
  const { selectTeam } = useTeam();

  const handleSelectTeam = useCallback((teamId: string) => {
    if (!teamId) return;

    selectTeam(teamId);
    onSelectTeam(teamId);
  }, []);

  // Se não houver equipes, exibir mensagem
  if (teams.length === 0) {
    return (
      <div className="space-y-4 p-6">
        <h2 className="text-2xl font-semibold">Minhas Equipes</h2>
        <div className="p-6 text-center text-muted-foreground">
          <p>Você ainda não participa de nenhuma equipe.</p>
          <p className="mt-2">Crie uma nova equipe para começar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-semibold">Minhas Equipes</h2>
      <div className="space-y-2">
        {teams.map((team) => (
          <div
            key={team.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedTeamId === team.id
                ? "bg-primary/5 border-primary/20 shadow-sm"
                : "hover:bg-accent border-border hover:border-primary/20"
            }`}
            onClick={() => handleSelectTeam(team.id)}
          >
            <h3 className="font-medium">{team.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {team.owner_email === userEmail ? "Líder" : "Membro"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
