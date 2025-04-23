import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadarDataPoint } from "@/resources/survey/survey-model";
import { ArrowDownIcon, ArrowUpIcon, Minus } from "lucide-react";

interface ResultsTableProps {
  userResults: RadarDataPoint[];
  teamResults?: RadarDataPoint[];
  leaderResults?: RadarDataPoint[];
}

export function ResultsTable({
  userResults,
  teamResults,
  leaderResults,
}: ResultsTableProps) {
  // Verificar se temos dados do usuário
  if (!userResults || userResults.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-md text-center">
        <p className="text-muted-foreground">
          Dados insuficientes para exibir a tabela
        </p>
      </div>
    );
  }

  // Obter todas as categorias possíveis de todas as fontes
  const allCategories = new Set<string>();
  userResults.forEach((item) => allCategories.add(item.category));
  teamResults?.forEach((item) => allCategories.add(item.category));
  leaderResults?.forEach((item) => allCategories.add(item.category));

  const categories = Array.from(allCategories).sort();

  // Processar os dados para a tabela
  const data = categories.map((category) => {
    const userValue =
      userResults.find((item) => item.category === category)?.value || 0;

    const teamValue =
      teamResults?.find((item) => item.category === category)?.value || 0;

    const leaderValue =
      leaderResults?.find((item) => item.category === category)?.value || 0;

    // Calcular a diferença entre a média da equipe e o líder
    // Valores positivos indicam que a equipe avalia melhor que o líder
    const hasTeamAndLeaderData =
      teamResults &&
      teamResults.length > 0 &&
      leaderResults &&
      leaderResults.length > 0;

    const difference = hasTeamAndLeaderData
      ? Number((teamValue - leaderValue).toFixed(1))
      : undefined;

    // Determinar a cor da diferença com base no valor
    const getDifferenceColor = (diff: number | undefined) => {
      if (diff === undefined) return "";
      if (diff > 0.5) return "text-green-600"; // Equipe avalia melhor que o líder
      if (diff < -0.5) return "text-red-600"; // Equipe avalia pior que o líder
      return "text-orange-500"; // Avaliações próximas
    };

    // Determinar o ícone para a diferença
    const getDifferenceIcon = (diff: number | undefined) => {
      if (diff === undefined) return <Minus size={16} />;
      if (diff > 0.5)
        return <ArrowUpIcon size={16} className="text-green-600" />;
      if (diff < -0.5)
        return <ArrowDownIcon size={16} className="text-red-600" />;
      return <Minus size={16} className="text-orange-500" />;
    };

    const getDifferenceText = (diff: number | undefined) => {
      if (diff === undefined) return "Sem dados suficientes";
      if (diff > 0.5) return "Equipe avalia melhor que o líder";
      if (diff < -0.5) return "Equipe avalia pior que o líder";
      return "Avaliações próximas";
    };

    return {
      category,
      user: userValue,
      team: teamValue,
      leader: leaderValue,
      difference,
      differenceColor: getDifferenceColor(difference),
      differenceIcon: getDifferenceIcon(difference),
      differenceText: getDifferenceText(difference),
    };
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Competência</TableHead>
            <TableHead className="text-right">Sua avaliação</TableHead>
            {teamResults && teamResults.length > 0 && (
              <TableHead className="text-right">Média da equipe</TableHead>
            )}
            {leaderResults && leaderResults.length > 0 && (
              <TableHead className="text-right">
                Avaliação da liderança
              </TableHead>
            )}
            {teamResults &&
              teamResults.length > 0 &&
              leaderResults &&
              leaderResults.length > 0 && (
                <TableHead className="text-right">
                  Diferença (Equipe - Líder)
                </TableHead>
              )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.category}>
              <TableCell className="font-medium">{row.category}</TableCell>
              <TableCell className="text-right">
                {row.user.toFixed(1)}
              </TableCell>
              {teamResults && teamResults.length > 0 && (
                <TableCell className="text-right">
                  {row.team.toFixed(1)}
                </TableCell>
              )}
              {leaderResults && leaderResults.length > 0 && (
                <TableCell className="text-right">
                  {row.leader.toFixed(1)}
                </TableCell>
              )}
              {teamResults &&
                teamResults.length > 0 &&
                leaderResults &&
                leaderResults.length > 0 && (
                  <TableCell
                    className={`text-right font-medium ${row.differenceColor} flex items-center justify-end gap-1`}
                    title={row.differenceText}
                  >
                    {row.difference !== undefined ? (
                      <>
                        {row.differenceIcon}
                        <span>
                          {row.difference > 0 ? "+" : ""}
                          {row.difference.toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {teamResults &&
        teamResults.length > 0 &&
        leaderResults &&
        leaderResults.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              <ArrowUpIcon size={16} className="inline text-green-600" />{" "}
              <span className="text-green-600 font-medium">
                Diferença positiva:
              </span>{" "}
              Equipe avalia a competência melhor que o líder
            </p>
            <p>
              <ArrowDownIcon size={16} className="inline text-red-600" />{" "}
              <span className="text-red-600 font-medium">
                Diferença negativa:
              </span>{" "}
              Equipe avalia a competência pior que o líder
            </p>
            <p>
              <Minus size={16} className="inline text-orange-500" />{" "}
              <span className="text-orange-500 font-medium">
                Diferença neutra:
              </span>{" "}
              Líder e equipe têm avaliações similares
            </p>
          </div>
        )}
    </div>
  );
}
