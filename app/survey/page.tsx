"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Layout } from "@/components/layout"
import { useToast } from "@/hooks/use-toast"
import { useSurvey } from "@/resources/survey/survey-hook"
import { QuestionSection, Section, Question } from "@/components/survey/question-section"
import { SetupProgress } from '@/components/team/setup-progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTeam } from "@/resources/team/team-hook"
import { useAuth } from "@/resources/auth/auth-hook"

export default function SurveyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()
  const { selectedTeam, currentMember, updateMemberStatus } = useTeam()
  const { 
    questions, sections, currentSection, setCurrentSection, 
    saveAnswers, isLoading, error, answers, profile,
    radarData, generateRadarData
  } = useSurvey()
  
  const [progress, setProgress] = useState(0)
  const answeredRef = useRef(new Set<string>())
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  
  // Verificar se o usuário tem um perfil configurado - apenas uma verificação inicial
  useEffect(() => {
    // Evitar redirecionamento durante Alt+Tab ou remontagens temporárias
    if (initialCheckDone) return;
    
    const checkProfile = async () => {
      try {
        // Verificar se existe um perfil no localStorage
        const storedProfile = localStorage.getItem("userProfile")
        const teamId = localStorage.getItem("teamId") || selectedTeam?.id || user?.team_id
        const teamMemberId = localStorage.getItem("teamMemberId")
        
        console.log("Verificando perfil e associação:", { 
          hasProfile: !!storedProfile || !!profile, 
          teamId, 
          teamMemberId 
        })
        
        // Se não tiver um perfil configurado e a autenticação já foi determinada, redirecionar
        if ((!storedProfile && !profile) && isAuthenticated !== undefined) {
          console.log("Perfil não encontrado, redirecionando...")
          router.push("/profile-survey")
        }
        // Se não tiver um time selecionado e a autenticação já foi determinada, redirecionar
        else if (!teamId && isAuthenticated !== undefined) {
          console.log("Time não encontrado, redirecionando...")
          router.push("/team-setup")
        }
        
        // Marcar verificação inicial como concluída
        setInitialCheckDone(true)
      } catch (error) {
        console.error("Erro ao verificar perfil:", error)
        // Não redirecionar em caso de erro para evitar loops
        setInitialCheckDone(true)
      }
    }
    
    checkProfile()
  }, [isAuthenticated, profile, router, selectedTeam?.id, user?.team_id]) // Dependências reduzidas para evitar execuções desnecessárias

  // Calcular progresso da pesquisa
  useEffect(() => {
    if (!questions.length) return
    
    const totalQuestions = questions.length
    const answered = answeredRef.current.size
    
    setProgress(Math.round((answered / totalQuestions) * 100))
  }, [questions, answers])

  // Marcar respostas existentes
  useEffect(() => {
    if (answers && Object.keys(answers).length > 0) {
      const answeredSet = new Set<string>()
      
      for (const [questionId, value] of Object.entries(answers)) {
        if (value !== null && value !== undefined) {
          answeredSet.add(questionId)
        }
      }
      
      answeredRef.current = answeredSet
    }
  }, [answers])

  // Exibir mensagens de erro
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  // Função para mudar de seção
  const handleSectionChange = useCallback((section: string) => {
    setCurrentSection(section)
  }, [setCurrentSection])

  // Submeter respostas
  const handleSubmit = useCallback(async () => {
    try {
      // Verificar se todas as perguntas foram respondidas
      const totalQuestions = questions.length
      const answered = answeredRef.current.size
      
      if (answered < totalQuestions) {
        const missingCount = totalQuestions - answered
        toast({
          title: "Questionário incompleto",
          description: `Faltam ${missingCount} ${missingCount === 1 ? 'pergunta' : 'perguntas'} para completar.`,
          variant: "destructive",
        })
        return
      }
      
      // Dados do membro para atualização de status
      const teamId = selectedTeam?.id || localStorage.getItem("teamId")
      const userEmail = user?.email || localStorage.getItem("userEmail")
      
      if (!teamId || !userEmail) {
        throw new Error("Dados de equipe ou usuário ausentes. Por favor, tente novamente.")
      }
      
      // Salvar respostas e gerar dados do radar
      const result = await saveAnswers()
      
      if (result) {
        // Atualizar status do membro para 'answered'
        await updateMemberStatus(teamId, userEmail, 'answered')
        
        // Gerar dados do radar
        await generateRadarData()
        
        toast({
          title: "Pesquisa concluída",
          description: "Suas respostas foram salvas com sucesso!",
        })
        
        // Redirecionar para resultados
        router.push("/results")
      }
    } catch (error: any) {
      toast({
        title: "Erro ao enviar pesquisa",
        description: error.message || "Ocorreu um erro ao salvar suas respostas.",
        variant: "destructive",
      })
    }
  }, [questions.length, user?.email, selectedTeam?.id, saveAnswers, updateMemberStatus, generateRadarData, toast, router])

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <SetupProgress currentPhase="survey" />
        <h1 className="text-3xl font-bold mb-4 text-center">Radar da Liderança 4.0</h1>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Progresso: {progress}%</span>
            <span className="text-sm">{answeredRef.current.size}/{questions.length} perguntas</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <Tabs defaultValue={currentSection} onValueChange={handleSectionChange}>
          <TabsList className="grid grid-cols-3 mb-6">
            {sections.map((section: Section) => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {sections.map((section: Section) => (
            <TabsContent key={section.id} value={section.id}>
              <QuestionSection 
                section={section} 
                questions={questions.filter((q: Question) => q.section_id === section.id)}
                answeredSet={answeredRef}
              />
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || answeredRef.current.size < questions.length}
          >
            Finalizar Pesquisa
          </Button>
        </div>
      </div>
    </Layout>
  )
}

