"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Layout } from "@/components/layout"
import { useToast } from "@/hooks/use-toast"
import { useSurvey } from "@/resources/survey/survey-hook"
import { QuestionSection } from "@/components/survey/question-section"
import { SetupProgress } from '@/components/team/setup-progress'
import { useTeam } from "@/resources/team/team-hook"
import { useAuth } from "@/resources/auth/auth-hook"

export default function SurveyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { selectedTeam, updateMemberStatus } = useTeam()
  const { 
    questions,
    loading,
    error,
    answers,
    saveAnswers
  } = useSurvey()
  
  const [progress, setProgress] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const answeredRef = useRef(new Set<string>())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calcular progresso da pesquisa
  useEffect(() => {
    if (!questions?.length) return;
    
    const totalQuestions = questions.length;
    const calculatedProgress = (answeredCount / totalQuestions) * 100;
    console.log('Progresso atualizado:', {
      totalQuestions,
      answeredCount,
      calculatedProgress,
      answeredRefSize: answeredRef.current.size
    });
    setProgress(Math.round(calculatedProgress));
  }, [questions, answeredCount]);

  // Marcar respostas existentes
  useEffect(() => {
    console.log('Respostas atualizadas:', {
      hasAnswers: !!answers,
      answersLength: answers ? Object.keys(answers).length : 0
    });

    if (answers && Object.keys(answers).length > 0) {
      const answeredSet = new Set<string>();
      
      for (const [questionId, value] of Object.entries(answers)) {
        if (value !== null && value !== undefined) {
          answeredSet.add(questionId);
        }
      }
      
      console.log('Set de respostas atualizado:', {
        answeredSetSize: answeredSet.size,
        answers: Array.from(answeredSet)
      });
      
      answeredRef.current = answeredSet;
      setAnsweredCount(answeredSet.size);
    }
  }, [answers]);

  // Exibir mensagens de erro
  useEffect(() => {
    if (error.profile || error.survey || error.openQuestions) {
      toast({
        title: "Erro",
        description: error.profile || error.survey || error.openQuestions,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Função para atualizar o progresso
  const updateProgress = useCallback((questionId: string) => {
    console.log('Atualizando progresso:', {
      questionId,
      previousSize: answeredRef.current.size
    });
    
    answeredRef.current.add(questionId);
    setAnsweredCount(answeredRef.current.size);
    
    console.log('Progresso atualizado:', {
      newSize: answeredRef.current.size,
      answers: Array.from(answeredRef.current)
    });
  }, []);

  // Submeter respostas
  const handleSubmit = useCallback(async () => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para enviar as respostas.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const totalQuestions = questions.length;
      const answered = answeredRef.current.size;
      
      console.log('Tentando submeter:', {
        totalQuestions,
        answered,
        isLoading: loading,
        currentAnswers: answers,
        answeredQuestions: Array.from(answeredRef.current)
      });

      if (answered < totalQuestions) {
        const missingCount = totalQuestions - answered;
        toast({
          title: "Questionário incompleto",
          description: `Faltam ${missingCount} ${missingCount === 1 ? 'pergunta' : 'perguntas'} para completar.`,
          variant: "destructive",
        });
        return;
      }
      
      if (!answers || Object.keys(answers).length === 0) {
        throw new Error("Nenhuma resposta encontrada para enviar");
      }
      
      // Dados do membro para atualização de status
      const teamId = selectedTeam?.id || localStorage.getItem("teamId");
      const userEmail = user?.email || localStorage.getItem("userEmail");
      
      if (!teamId || !userEmail) {
        throw new Error("Dados de equipe ou usuário ausentes. Por favor, tente novamente.");
      }
      
      // Salvar respostas finais
      const result = await saveAnswers(answers);
      
      if (result) {
        // Atualizar status do membro
        await updateMemberStatus(teamId, userEmail, 'answered');
        
        toast({
          title: "Questionário concluído",
          description: "Suas respostas foram salvas com sucesso! Agora vamos para as perguntas abertas.",
        });
        
        router.push("/open-questions");
      } else {
        throw new Error("Não foi possível salvar as respostas. Por favor, tente novamente.");
      }
    } catch (error: any) {
      console.error('Erro ao submeter:', error);
      toast({
        title: "Erro ao enviar questionário",
        description: error.message || "Ocorreu um erro ao salvar suas respostas.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false)
    }
  }, [
    questions,
    answers,
    saveAnswers,
    updateMemberStatus,
    toast,
    router,
    user?.email,
    selectedTeam?.id,
    loading
  ]);

  // Log do estado atual sempre que relevante
  useEffect(() => {
    console.log('Estado atual:', {
      questionsLength: questions?.length,
      answeredCount,
      progress,
      isLoading: loading,
      answeredRefSize: answeredRef.current.size
    });
  }, [questions, answeredCount, progress, loading]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Questionário de Competências</h1>
          <p className="text-muted-foreground">
            Avalie cada competência de acordo com sua experiência e percepção.
            Suas respostas são confidenciais e ajudarão a identificar áreas de desenvolvimento.
          </p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          <QuestionSection 
            questions={questions?.map(q => ({
              id: q.id,
              question: q.text,
              competency: q.id
            })) || []}
            answeredSet={answeredRef}
            onAnswerUpdate={updateProgress}
          />

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSubmit}
              disabled={progress < 100 || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Enviando..." : "Finalizar Pesquisa"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

