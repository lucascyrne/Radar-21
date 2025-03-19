"use client"

import { Layout } from "@/components/layout"
import { OpenQuestionForm } from "@/components/survey/open-question-form"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useSurvey } from "@/resources/survey/survey-hook"
import { useTeam } from "@/resources/team/team-hook"
import { OpenQuestionsFormValues } from "@/resources/survey/survey-model"


export default function OpenQuestionsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentMember } = useTeam()
  const { completeAllSteps } = useSurvey()
  const { saveOpenQuestions } = useSurvey()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async (data: OpenQuestionsFormValues) => {
    if (!currentMember?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para enviar as respostas.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const success = await saveOpenQuestions(data)
      if (!success) throw new Error("Falha ao salvar respostas")

      const statusUpdated = await completeAllSteps()
      if (!statusUpdated) throw new Error("Falha ao atualizar status")

      toast({
        title: "Sucesso!",
        description: "Suas respostas foram salvas. Obrigado por participar!",
      })

      router.push("/results")
    } catch (error) {
      console.error("Erro ao submeter respostas:", error)
      toast({
        title: "Erro ao salvar respostas",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [currentMember?.id])

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-3xl">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Perguntas Abertas</h1>
          <p className="text-muted-foreground">
            Por favor, responda às perguntas abaixo com suas próprias palavras.
            Suas respostas nos ajudarão a entender melhor sua experiência e perspectivas.
          </p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6">
          <OpenQuestionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </div>
    </Layout>
  )
}


