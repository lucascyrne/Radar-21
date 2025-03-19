"use client"

import { useEffect, useState } from "react"
import { Layout } from "@/components/layout"
import { useToast } from "@/hooks/use-toast"
import { useSurvey } from "@/resources/survey/survey-hook"
import { useTeam } from "@/resources/team/team-hook"
import { ResultsTable } from "@/components/survey/results-table"
import { OpenQuestionsResults } from "@/components/survey/open-questions-results"
import { RadarChart } from "@/components/survey/radar-chart"
import { CompetencyBadge } from "@/components/survey/competency-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadarDataPoint, SurveyResponses } from "@/resources/survey/survey-model"
import { SurveyService } from "@/resources/survey/survey.service"
import { OpenQuestionResponse } from "@/resources/survey/survey-model"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/resources/auth/auth-hook"

const competencyDescriptions: Record<string, string> = {
  'Liderança': 'Capacidade de influenciar e guiar equipes, promovendo um ambiente colaborativo e alcançando resultados através das pessoas.',
  'Comunicação': 'Habilidade de transmitir ideias de forma clara e efetiva, além de escutar ativamente e promover diálogo construtivo.',
  'Trabalho em Equipe': 'Capacidade de colaborar efetivamente com outros, contribuindo para objetivos comuns e promovendo sinergia no grupo.',
  'Resolução de Problemas': 'Habilidade de identificar, analisar e resolver desafios de forma estruturada e eficiente.',
  'Inovação': 'Capacidade de pensar criativamente e implementar novas ideias que agregam valor ao trabalho e à organização.',
  'Adaptabilidade': 'Flexibilidade para lidar com mudanças e capacidade de se ajustar a novos contextos e demandas.',
  'Gestão do Tempo': 'Habilidade de priorizar tarefas, gerenciar prazos e utilizar recursos de forma eficiente.',
  'Pensamento Crítico': 'Capacidade de analisar situações de forma objetiva, avaliar diferentes perspectivas e tomar decisões fundamentadas.',
  'Ética Profissional': 'Comprometimento com valores e princípios éticos no ambiente profissional.',
  'Conhecimento Técnico': 'Domínio das habilidades e ferramentas necessárias para executar o trabalho com excelência.',
  'Aprendizado Contínuo': 'Disposição e capacidade de buscar constantemente novos conhecimentos e desenvolver novas habilidades.',
  'Orientação a Resultados': 'Foco em alcançar objetivos e metas, mantendo altos padrões de qualidade e eficiência.'
}

export default function ResultsPage() {
  const { toast } = useToast()
  const { currentMember, teamMembers, loadTeamMembers } = useTeam()
  const { surveyResponses, answers } = useSurvey()
  const [userResults, setUserResults] = useState<RadarDataPoint[]>([])
  const [teamResults, setTeamResults] = useState<RadarDataPoint[]>([])
  const [leaderResults, setLeaderResults] = useState<RadarDataPoint[]>([])
  const [openQuestions, setOpenQuestions] = useState<OpenQuestionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userResponses, setUserResponses] = useState<SurveyResponses | null>(null)

  // Encontrar team_id e team_member_id do localStorage se necessário
  useEffect(() => {
    const teamId = localStorage.getItem("teamId")
    const teamMemberId = localStorage.getItem("teamMemberId")
    
    console.log('IDs do localStorage:', { teamId, teamMemberId })
    
    if (teamId && teamMembers.length === 0) {
      loadTeamMembers(teamId)
    }

    // Se temos respostas do usuário diretamente, vamos usá-las
    if (answers) {
      setUserResponses(answers)
    } else if (surveyResponses) {
      setUserResponses(surveyResponses)
    } else if (teamMemberId) {
      // Tentar carregar respostas do usuário diretamente do serviço
      const loadResponses = async () => {
        try {
          const responses = await SurveyService.loadSurveyResponses(teamMemberId)
          if (responses) {
            setUserResponses(responses.responses)
          }
        } catch (error) {
          console.error('Erro ao carregar respostas:', error)
        }
      }
      
      loadResponses()
    }
  }, [answers, surveyResponses, teamMembers.length])

  // Processar respostas do usuário quando disponíveis
  useEffect(() => {
    const processUserResponses = () => {
      if (!userResponses) return
      
      console.log('Processando respostas do usuário:', userResponses)
      
      // Transformar respostas do usuário para formato do radar
      const userDataPoints = Object.entries(userResponses)
        .filter(([key]) => key.startsWith('q'))
        .map(([key, value]) => ({
          category: SurveyService.getCompetencyName(key),
          value: Number(value)
        }))
      
      setUserResults(userDataPoints)
    }
    
    processUserResponses()
  }, [userResponses])

  // Carregar dados da equipe e do líder
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setIsLoading(true)
        console.log('Tentando carregar dados da equipe...')
        
        // Determinar o team_id
        const teamId = currentMember?.team_id || localStorage.getItem("teamId")
        if (!teamId) {
          console.error('ID da equipe não encontrado')
          setIsLoading(false)
          return
        }
        
        console.log('Carregando resultados para equipe:', teamId)
        
        // Buscar os dados de media da equipe e respostas do líder
        const teamData = await SurveyService.getTeamResults(teamId)
        
        if (teamData) {
          console.log('Dados da equipe recebidos:', teamData)
          
          // Transformar média da equipe
          setTeamResults(teamData.teamAverage.map(item => ({
            category: SurveyService.getCompetencyName(item.questionId),
            value: item.average
          })))
          
          // Transformar respostas do líder
          setLeaderResults(teamData.leaderResponses.map(item => ({
            category: SurveyService.getCompetencyName(item.questionId),
            value: item.value
          })))
        } else {
          console.warn('Sem dados de equipe disponíveis')
        }
        
        // Determinar o memberId para buscar respostas abertas
        const memberId = currentMember?.id || localStorage.getItem("teamMemberId")
        if (memberId) {
          // Carregar respostas abertas
          console.log('Carregando respostas abertas para membro:', memberId)
          const openQuestionsData = await SurveyService.loadOpenQuestions(memberId)
          setOpenQuestions(openQuestionsData)
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Erro ao carregar resultados:', error)
        toast({
          title: "Erro ao carregar resultados",
          description: "Não foi possível carregar os resultados da equipe.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }
    
    // Se temos respostas do usuário, começar a carregar dados da equipe
    if (userResults.length > 0) {
      loadTeamData()
    }
  }, [userResults.length, currentMember?.team_id, currentMember?.id, toast])

  // Verificar se temos dados para exibir
  const hasUserData = userResults.length > 0
  const hasTeamData = teamResults.length > 0
  const hasLeaderData = leaderResults.length > 0
  
  console.log('Estado atual dos dados:', {
    hasUserData,
    hasTeamData,
    hasLeaderData,
    isLoading
  })

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Resultados da Avaliação</h1>
          <p className="text-muted-foreground">
            Visualize seus resultados e compare com a média da equipe e a avaliação da liderança.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex justify-center w-full">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="competencies">Competências</TabsTrigger>
              <TabsTrigger value="open-questions">Respostas</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {isLoading || !hasUserData ? (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Gráfico Radar</h2>
                    <div className="h-[400px]">
                      <Skeleton className="h-full w-full" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Tabela Comparativa</h2>
                    <Skeleton className="h-[200px] w-full" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Gráfico Radar</h2>
                    <RadarChart
                      userResults={userResults}
                      teamResults={teamResults}
                      leaderResults={leaderResults}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Tabela Comparativa</h2>
                    <ResultsTable
                      userResults={userResults}
                      teamResults={teamResults}
                      leaderResults={leaderResults}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="competencies" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Detalhamento por Competência</h2>
                {isLoading || !hasUserData ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(12)].map((_, i) => (
                      <Skeleton key={i} className="h-[180px] w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userResults.map((result) => (
                      <CompetencyBadge
                        key={result.category}
                        competency={result.category}
                        description={competencyDescriptions[result.category]}
                        value={result.value}
                        teamValue={teamResults?.find(t => t.category === result.category)?.value}
                        leaderValue={leaderResults?.find(l => l.category === result.category)?.value}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="open-questions">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Respostas Dissertativas</h2>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[100px] w-full" />
                    <Skeleton className="h-[100px] w-full" />
                  </div>
                ) : openQuestions ? (
                  <OpenQuestionsResults data={openQuestions} />
                ) : (
                  <p className="text-muted-foreground">Nenhuma resposta dissertativa encontrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

