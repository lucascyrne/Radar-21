"use client"

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  PolarRadiusAxis,
  Tooltip,
} from "recharts"
import { Card } from './ui/card';

export interface RadarDataPoint {
  category: string;
  value: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  compareData?: RadarDataPoint[];
  compareLabel?: string;
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
            {entry.name}: {entry.value}
          </p>
        ))}
      </Card>
    );
  }

  return null;
};

export function RadarChart({ data, compareData, compareLabel = "Comparação" }: RadarChartProps) {
  // Verificar se temos dados para exibir
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Não há dados disponíveis para exibir o radar.</p>
      </div>
    );
  }

  // Transformar os dados para o formato esperado pelo Recharts
  const transformedData = data.map(item => ({
    subject: item.category,
    A: item.value,
    fullMark: 5,
    ...(compareData ? { B: compareData.find(d => d.category === item.category)?.value || 0 } : {})
  }));

  // Calcular o valor máximo para o eixo radial
  const maxValue = Math.max(
    ...data.map(item => item.value),
    ...(compareData ? compareData.map(item => item.value) : [0])
  );
  
  // Arredondar para o próximo número inteiro e adicionar um pouco de espaço
  const domainMax = Math.min(Math.ceil(maxValue) + 0.5, 5);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadarChart 
        cx="50%" 
        cy="50%" 
        outerRadius="70%" 
        data={transformedData}
      >
        <PolarGrid gridType="circle" />
        <PolarAngleAxis 
          dataKey="subject" 
          tick={{ 
            fontSize: 12, 
            fill: "#64748b",
            dy: 5
          }}
          tickLine={false}
        />
        <PolarRadiusAxis 
          domain={[0, domainMax]} 
          tickCount={6} 
          axisLine={false}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <Radar
          name="Suas Competências"
          dataKey="A"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.6}
          dot={true}
          activeDot={{ r: 5 }}
        />
        
        {compareData && compareData.length > 0 && (
          <Radar
            name={compareLabel}
            dataKey="B"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
            dot={true}
            activeDot={{ r: 5 }}
          />
        )}
        
        <Legend 
          iconSize={10}
          wrapperStyle={{ 
            paddingTop: 20,
            fontSize: 12
          }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}

