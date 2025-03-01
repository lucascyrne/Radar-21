"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Share2 } from "lucide-react"
import { RadarChart } from "@/components/radar-chart"

// Categories for the radar chart
const categories = [
  { name: "Adaptabilidade", questions: [1, 2] },
  { name: "Colaboração", questions: [3, 6] },
  { name: "Inovação", questions: [4, 7] },
  { name: "Análise de Dados", questions: [5, 10] },
  { name: "Liderança Digital", questions: [8, 11] },
  { name: "Aprendizado Contínuo", questions: [9, 12] },
]

// Mock team data (in a real app, this would come from a database)
const mockTeamData = [
  { category: "Adaptabilidade", value: 4.2 },
  { category: "Colaboração", value: 3.8 },
  { category: "Inovação", value: 3.5 },
  { category: "Análise de Dados", value: 4.0 },
  { category: "Liderança Digital", value: 3.7 },
  { category: "Aprendizado Contínuo", value: 4.1 },
]

// Mock industry data
const mockIndustryData = [
  { category: "Adaptabilidade", value: 3.9 },
  { category: "Colaboração", value: 3.6 },
  { category: "Inovação", value: 3.3 },
  { category: "Análise de Dados", value: 3.8 },
  { category: "Liderança Digital", value: 3.5 },
  { category: "Aprendizado Contínuo", value: 3.7 },
]

export default function Radar() {
  const router = useRouter()
  const [userData, setUserData] = useState<Array<{ category: string; value: number }>>([])
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  useEffect(() => {
    // Check if survey was completed
    const surveyAnswers = localStorage.getItem("surveyAnswers")
    const openQuestionAnswers = localStorage.getItem("openQuestionAnswers")

    if (!surveyAnswers || !openQuestionAnswers) {
      router.push("/survey")
      return
    }

    // Calculate user's radar data
    const answers = JSON.parse(surveyAnswers)
    const userRadarData = categories.map((category) => {
      // Calculate average score for this category
      const categoryScores = category.questions.map((q) => answers[q] || 0)
      const average = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length

      return {
        category: category.name,
        value: Number.parseFloat(average.toFixed(1)),
      }
    })

    setUserData(userRadarData)
    setIsDataLoaded(true)
  }, [router])

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF or image of the radar chart
    alert("Em uma aplicação real, isso geraria um download do gráfico radar em formato PDF ou imagem.")
  }

  const handleShare = () => {
    // In a real app, this would open sharing options
    alert("Em uma aplicação real, isso abriria opções para compartilhar o resultado nas redes sociais.")
  }

  if (!isDataLoaded) {
    return (
      <div className="container max-w-3xl py-12 text-center">
        <p>Carregando seus resultados...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Seu Radar de Liderança 4.0</h1>

      <Card>
        <CardHeader>
          <CardTitle>Resultados da Avaliação</CardTitle>
          <CardDescription>Compare suas competências com sua equipe e com a média da indústria.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="individual">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="individual">Individual</TabsTrigger>
              <TabsTrigger value="team">Comparação com Equipe</TabsTrigger>
              <TabsTrigger value="industry">Comparação com Indústria</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-4">
              <div className="aspect-square max-w-md mx-auto">
                <RadarChart data={userData} />
              </div>
              <div className="space-y-4 mt-8">
                <h3 className="text-xl font-bold">Suas Competências</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                      <span>{item.category}</span>
                      <span className="font-bold">{item.value}/5</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <div className="aspect-square max-w-md mx-auto">
                <RadarChart data={userData} compareData={mockTeamData} compareLabel="Equipe" />
              </div>
              <div className="space-y-4 mt-8">
                <h3 className="text-xl font-bold">Comparação com sua Equipe</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userData.map((item, index) => {
                    const teamValue = mockTeamData.find((d) => d.category === item.category)?.value || 0
                    const difference = (item.value - teamValue).toFixed(1)
                    const isPositive = Number.parseFloat(difference) > 0

                    return (
                      <div key={index} className="p-3 border rounded-md">
                        <div className="flex justify-between items-center">
                          <span>{item.category}</span>
                          <span className="font-bold">{item.value}/5</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span>Média da equipe: {teamValue}/5</span>
                          <span
                            className={
                              isPositive ? "text-green-600" : Number.parseFloat(difference) < 0 ? "text-red-600" : ""
                            }
                          >
                            {isPositive ? "+" : ""}
                            {difference}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="industry" className="space-y-4">
              <div className="aspect-square max-w-md mx-auto">
                <RadarChart data={userData} compareData={mockIndustryData} compareLabel="Indústria" />
              </div>
              <div className="space-y-4 mt-8">
                <h3 className="text-xl font-bold">Comparação com a Indústria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userData.map((item, index) => {
                    const industryValue = mockIndustryData.find((d) => d.category === item.category)?.value || 0
                    const difference = (item.value - industryValue).toFixed(1)
                    const isPositive = Number.parseFloat(difference) > 0

                    return (
                      <div key={index} className="p-3 border rounded-md">
                        <div className="flex justify-between items-center">
                          <span>{item.category}</span>
                          <span className="font-bold">{item.value}/5</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span>Média da indústria: {industryValue}/5</span>
                          <span
                            className={
                              isPositive ? "text-green-600" : Number.parseFloat(difference) < 0 ? "text-red-600" : ""
                            }
                          >
                            {isPositive ? "+" : ""}
                            {difference}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar Resultado
          </Button>
          <Button variant="outline" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

