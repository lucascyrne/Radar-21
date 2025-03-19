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
import { Card } from '@/components/ui/card'

export interface RadarDataPoint {
  category: string
  value: number
}

interface RadarChartProps {
  userResults: RadarDataPoint[]
  teamResults?: RadarDataPoint[]
  leaderResults?: RadarDataPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
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
    )
  }

  return null
}

export function RadarChart({ userResults, teamResults, leaderResults }: RadarChartProps) {
  const data = userResults.map((item) => {
    const teamValue = teamResults?.find(
      (team) => team.category === item.category
    )?.value
    const leaderValue = leaderResults?.find(
      (leader) => leader.category === item.category
    )?.value

    return {
      category: item.category,
      user: item.value,
      team: teamValue || 0,
      leader: leaderValue || 0,
    }
  })

  console.log('Dados do radar chart:', data)

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsRadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="category" />
        <PolarRadiusAxis angle={30} domain={[0, 5]} />
        <Radar
          name="Sua avaliação"
          dataKey="user"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.6}
        />
        <Radar
          name="Média da equipe"
          dataKey="team"
          stroke="#16a34a"
          fill="#16a34a"
          fillOpacity={0.6}
        />
        <Radar
          name="Avaliação da liderança"
          dataKey="leader"
          stroke="#dc2626"
          fill="#dc2626"
          fillOpacity={0.6}
        />
        <Legend />
        <Tooltip content={<CustomTooltip />} />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}