"use client"

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface RadarChartProps {
  data: Array<{ category: string; value: number }>
  compareData?: Array<{ category: string; value: number }>
  compareLabel?: string
}

export function RadarChart({ data, compareData, compareLabel }: RadarChartProps) {
  // Transform data for Recharts
  const chartData = data.map((item) => ({
    category: item.category,
    user: item.value,
    ...(compareData
      ? { [compareLabel || "compare"]: compareData.find((d) => d.category === item.category)?.value || 0 }
      : {}),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="category" />

        <Radar name="Você" dataKey="user" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} dot />

        {compareData && (
          <Radar
            name={compareLabel || "Comparação"}
            dataKey={compareLabel || "compare"}
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
            dot
          />
        )}

        <Legend />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}

