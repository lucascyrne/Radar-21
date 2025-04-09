import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadarDataPoint } from "@/resources/survey/survey-model";

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
  const data = userResults.map((item) => {
    const teamValue = teamResults?.find(
      (team) => team.category === item.category
    )?.value;
    const leaderValue = leaderResults?.find(
      (leader) => leader.category === item.category
    )?.value;

    // Calcular a diferença entre equipe e líder (positivo quando equipe > líder)
    const difference =
      teamValue !== undefined && leaderValue !== undefined
        ? Number((teamValue - leaderValue).toFixed(1))
        : undefined;

    // Determinar a cor da diferença
    const getDifferenceColor = (diff: number | undefined) => {
      if (diff === undefined) return "";
      if (diff > 0.5) return "text-green-600";
      if (diff < -0.5) return "text-red-600";
      return "";
    };

    return {
      category: item.category,
      user: item.value,
      team: teamValue || 0,
      leader: leaderValue || 0,
      difference,
      differenceColor: getDifferenceColor(difference),
    };
  });

  console.log("Dados da tabela:", data);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Competência</TableHead>
            <TableHead className="text-right">Sua avaliação</TableHead>
            <TableHead className="text-right">Média da equipe</TableHead>
            <TableHead className="text-right">Avaliação da liderança</TableHead>
            <TableHead className="text-right">
              Diferença (Equipe - Líder)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.category}>
              <TableCell className="font-medium">{row.category}</TableCell>
              <TableCell className="text-right">
                {row.user.toFixed(1)}
              </TableCell>
              <TableCell className="text-right">
                {row.team.toFixed(1)}
              </TableCell>
              <TableCell className="text-right">
                {row.leader.toFixed(1)}
              </TableCell>
              <TableCell
                className={`text-right font-medium ${row.differenceColor}`}
              >
                {row.difference !== undefined ? row.difference : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
