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
    return (
      <Card className="bg-white p-3 shadow-md border border-gray-200">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(1)}
          </p>
        ))}
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

    // Calcular a diferença (equipe - líder) para consistência com a tabela
    const difference =
      teamValue && leaderValue ? teamValue - leaderValue : null;

    return {
      category,
      user: userValue,
      team: teamValue,
      leader: leaderValue,
      difference: difference,
    };
  });

  // Definir cores consistentes
  const userColor = "#2563eb"; // Azul
  const teamColor = "#16a34a"; // Verde
  const leaderColor = "#dc2626"; // Vermelho

  return (
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

        {/* Radar da equipe (se disponível) */}
        {teamResults && teamResults.length > 0 && (
          <Radar
            name="Média da equipe"
            dataKey="team"
            stroke={teamColor}
            fill={teamColor}
            fillOpacity={0.6}
          />
        )}

        {/* Radar do líder (se disponível) */}
        {leaderResults && leaderResults.length > 0 && (
          <Radar
            name="Avaliação da liderança"
            dataKey="leader"
            stroke={leaderColor}
            fill={leaderColor}
            fillOpacity={0.6}
          />
        )}

        <Legend />
        <Tooltip content={<CustomTooltip />} />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
