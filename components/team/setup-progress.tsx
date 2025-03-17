import { Progress } from "@/components/ui/progress"

export type SetupPhase = 'team' | 'profile' | 'survey' | 'results';

interface SetupProgressProps {
  currentPhase: SetupPhase;
}

export function SetupProgress({ currentPhase }: SetupProgressProps) {
  // Mapeamento de fases para valores de progresso
  const progressMap: Record<SetupPhase, number> = {
    team: 25,
    profile: 50,
    survey: 75,
    results: 100
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2 text-sm font-medium">
        <span className={currentPhase === 'team' ? 'font-bold' : 'text-muted-foreground'}>
          Minha Equipe
        </span>
        <span className={currentPhase === 'profile' ? 'font-bold' : 'text-muted-foreground'}>
          Meu Perfil
        </span>
        <span className={currentPhase === 'survey' ? 'font-bold' : 'text-muted-foreground'}>
          Perguntas Abertas
        </span>
        <span className={currentPhase === 'results' ? 'font-bold' : 'text-muted-foreground'}>
          Resultados
        </span>
      </div>
      <Progress value={progressMap[currentPhase]} className="h-2" />
    </div>
  );
} 