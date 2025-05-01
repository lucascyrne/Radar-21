"use client";

import { Card } from "@/components/ui/card";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface RadarDataPoint {
  category: string;
  value: number;
}

interface RadarChartProps {
  userResults: RadarDataPoint[];
  teamResults?: RadarDataPoint[];
  leaderResults?: RadarDataPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // Verificar se temos dados do líder e da equipe para mostrar diferença
    const teamValue = payload.find((p) => p.name === "Média da equipe")?.value;
    const leaderValue = payload.find(
      (p) => p.name === "Avaliação da liderança"
    )?.value;

    let difference = null;
    let differenceClass = "";

    if (teamValue !== undefined && leaderValue !== undefined) {
      difference = (Number(teamValue) - Number(leaderValue)).toFixed(1);
      if (Number(difference) > 0.5) {
        differenceClass = "text-green-600 font-medium";
      } else if (Number(difference) < -0.5) {
        differenceClass = "text-red-600 font-medium";
      } else {
        differenceClass = "text-orange-500 font-medium";
      }
    }

    return (
      <Card className="bg-white p-3 shadow-md border border-gray-200">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {Number(entry.value).toFixed(1)}
          </p>
        ))}
        {difference !== null && (
          <p className={differenceClass}>
            Diferença: {Number(difference) > 0 ? "+" : ""}
            {difference}
          </p>
        )}
      </Card>
    );
  }

  return null;
};

export function RadarChart({
  userResults,
  teamResults,
  leaderResults,
}: RadarChartProps) {
  // Verificar se temos dados
  if (!userResults || userResults.length === 0) {
    console.warn("RadarChart: Dados do usuário não fornecidos");
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-md">
        <p className="text-muted-foreground">
          Dados insuficientes para exibir o gráfico
        </p>
      </div>
    );
  }

  // Obter todas as categorias possíveis
  const allCategories = new Set<string>();
  userResults.forEach((item) => allCategories.add(item.category));
  teamResults?.forEach((item) => allCategories.add(item.category));
  leaderResults?.forEach((item) => allCategories.add(item.category));

  const categories = Array.from(allCategories);

  // Criar dados normalizados para o gráfico
  const data = categories.map((category) => {
    const userValue =
      userResults.find((item) => item.category === category)?.value || 0;

    const teamValue =
      teamResults?.find((item) => item.category === category)?.value || 0;

    const leaderValue =
      leaderResults?.find((item) => item.category === category)?.value || 0;

    // Calcular a diferença (equipe - líder)
    const difference = Number((teamValue - leaderValue).toFixed(1));

    return {
      category,
      user: userValue,
      team: teamValue,
      leader: leaderValue,
      difference,
    };
  });

  // Definir cores consistentes
  const userColor = "#2563eb"; // Azul
  const teamColor = "#16a34a"; // Verde
  const leaderColor = "#dc2626"; // Vermelho

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={400}>
        <RechartsRadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" />
          <PolarRadiusAxis angle={30} domain={[0, 5]} />

          {/* Radar do usuário */}
          <Radar
            name="Sua avaliação"
            dataKey="user"
            stroke={userColor}
            fill={userColor}
            fillOpacity={0.6}
          />

          {/* Radar da equipe (sempre exibir) */}
          <Radar
            name="Média da equipe"
            dataKey="team"
            stroke={teamColor}
            fill={teamColor}
            fillOpacity={0.6}
          />

          {/* Radar do líder (sempre exibir) */}
          <Radar
            name="Avaliação da liderança"
            dataKey="leader"
            stroke={leaderColor}
            fill={leaderColor}
            fillOpacity={0.6}
          />

          <Legend />
          <Tooltip content={<CustomTooltip />} />
        </RechartsRadarChart>
      </ResponsiveContainer>

      <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md">
        <p className="font-medium mb-1">Análise comparativa:</p>
        <p>
          <span className="text-green-600 font-medium">■</span> Quando a equipe
          avalia melhor que o líder (diferença positiva), indica uma percepção
          mais positiva da equipe.
        </p>
        <p>
          <span className="text-red-600 font-medium">■</span> Quando o líder
          avalia melhor que a equipe (diferença negativa), pode indicar
          oportunidades de melhoria na comunicação.
        </p>
      </div>
    </div>
  );
}
