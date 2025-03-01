"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from "recharts"
import { Download, Share2, FileDown } from "lucide-react"

// Mock data for the radar chart and analysis
const competencies = [
  { name: "Abertura", description: "Capacidade de receber e dar feedback", user: 4, team: 3.5 },
  { name: "Agilidade", description: "Rapidez na ação e reação", user: 3, team: 3.2 },
  { name: "Confiança", description: "Relação profissional baseada em confiança mútua", user: 5, team: 4.5 },
  { name: "Empatia", description: "Compreensão e consideração pelos outros", user: 4, team: 3.8 },
  { name: "Articulação", description: "Conexão e utilização de competências", user: 3, team: 3.3 },
  { name: "Adaptabilidade", description: "Capacidade de se adaptar a mudanças", user: 4, team: 3.7 },
  { name: "Inovação", description: "Busca por novas ideias e soluções", user: 5, team: 4.2 },
  { name: "Comunicação", description: "Fluidez na troca de informações", user: 4, team: 3.9 },
  { name: "Descentralização", description: "Tomada de decisão participativa", user: 3, team: 3.1 },
  { name: "Auto-organização", description: "Capacidade de se organizar coletivamente", user: 4, team: 3.6 },
  { name: "Colaboração", description: "Trabalho em equipe efetivo", user: 5, team: 4.3 },
  { name: "Resiliência", description: "Atitude positiva diante de desafios", user: 4, team: 3.8 },
]

export default function Results() {
  const router = useRouter()
  const [teamName, setTeamName] = useState("")
  const [teamMembers, setTeamMembers] = useState<Array<{ email: string; status: string }>>([])

  useEffect(() => {
    // Load team data
    const savedTeamName = localStorage.getItem("teamName")
    const savedTeamMembers = localStorage.getItem("teamMembers")

    if (savedTeamName) {
      setTeamName(savedTeamName)
    }

    if (savedTeamMembers) {
      setTeamMembers(JSON.parse(savedTeamMembers))
    }

    // In a real app, we would load the actual survey results here
  }, [])

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF or image of the radar chart
    alert("Em uma aplicação real, isso geraria um download do gráfico radar em formato PDF ou imagem.")
  }

  const handleShare = () => {
    // In a real app, this would generate a unique URL for sharing
    alert("Em uma aplicação real, isso geraria um URL único para compartilhar os resultados.")
  }

  const handleDownloadPDF = () => {
    // In a real app, this would generate and download a PDF with the complete analysis
    alert("Em uma aplicação real, isso geraria um download do PDF com a análise completa.")
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <div className="flex justify-between mb-2 text-sm font-medium">
          <span className="text-muted-foreground">Minha Equipe</span>
          <span className="text-muted-foreground">Meu Perfil</span>
          <span className="text-muted-foreground">Questionário das Competências de Liderança 4.0</span>
          <span className="font-bold">Resultados</span>
        </div>
        <Progress value={100} className="h-2" />
      </div>

      <h1 className="text-3xl font-bold mb-8 text-center">Resultados</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Equipe {teamName}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status do convite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member, index) => (
                <TableRow key={index}>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Radar das Competências de Liderança 4.0</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competencies}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={30} domain={[0, 5]} />
                <Radar name="Você" dataKey="user" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} />
                <Radar name="Equipe" dataKey="team" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.2} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competência</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Sua Resposta</TableHead>
                <TableHead>Média da Equipe</TableHead>
                <TableHead>Diferença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competencies.map((competency, index) => (
                <TableRow key={index}>
                  <TableCell>{competency.name}</TableCell>
                  <TableCell>{competency.description}</TableCell>
                  <TableCell>{competency.user}</TableCell>
                  <TableCell>{competency.team.toFixed(1)}</TableCell>
                  <TableCell className={competency.user - competency.team > 0 ? "text-green-600" : "text-red-600"}>
                    {(competency.user - competency.team).toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-center space-x-4 mb-8">
        <Button onClick={handleDownload} className="flex items-center">
          <Download className="mr-2 h-4 w-4" /> Baixar gráfico
        </Button>
        <Button onClick={handleShare} variant="outline" className="flex items-center">
          <Share2 className="mr-2 h-4 w-4" /> Compartilhar URL único
        </Button>
      </div>

      <div className="flex justify-center">
        <Button onClick={handleDownloadPDF} className="flex items-center" variant="secondary">
          <FileDown className="mr-2 h-4 w-4" /> Baixar PDF com análise completa
        </Button>
      </div>
    </div>
  )
}

