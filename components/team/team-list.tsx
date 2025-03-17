import { useCallback } from 'react';
import { Team } from '@/resources/team/team-model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamListProps {
  teams: Team[];
  selectedTeamId: string | undefined;
  userEmail: string | null;
  onSelectTeam: (teamId: string) => void;
}

export function TeamList({ teams, selectedTeamId, userEmail, onSelectTeam }: TeamListProps) {
  const handleSelectTeam = useCallback((teamId: string) => {
    onSelectTeam(teamId);
  }, [onSelectTeam]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Minhas Equipes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teams.map(team => (
            <div 
              key={team.id} 
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                selectedTeamId === team.id 
                  ? 'bg-primary/10' 
                  : 'hover:bg-muted'
              }`}
              onClick={() => handleSelectTeam(team.id)}
            >
              <h3 className="font-medium">{team.name}</h3>
              <p className="text-sm text-muted-foreground">
                {team.owner_email === userEmail ? 'Líder' : 'Membro'}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 