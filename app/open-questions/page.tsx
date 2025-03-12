"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Layout } from "@/components/layout"
import { useToast } from "@/hooks/use-toast"
import { useSurvey } from "@/resources/survey/survey-hook"
import { openQuestionsSchema, OpenQuestionsFormValues } from "@/resources/survey/survey-model"
import { useAuth } from "@/resources/auth/auth-hook"

// Definição das perguntas abertas
const questions = [
  {
    id: "q13",
    competence: "Ambiente de Trabalho",
    question: "Na sua opinião, o que poderia ser melhorado no ambiente de trabalho físico ou psicológico, ou nas relações profissionais dentro da equipe ou com a gestão?",
  },
  {
    id: "q14",
    competence: "Formação",
    question: "Na sua opinião, como a universidade poderia ter lhe preparado melhor para os desafios profissionais que você enfrentou após a graduação?",
  },
]

export default function OpenQuestions() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  
  // Usar o hook sem desestruturação para evitar problemas de tipo
  const surveyContext = useSurvey()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inicializar o formulário com react-hook-form
  const form = useForm<OpenQuestionsFormValues>({
    resolver: zodResolver(openQuestionsSchema),
    defaultValues: {
      q13: "",
      q14: "",
    },
  })

  // Verificar se o usuário completou as etapas anteriores
  useEffect(() => {
    const teamName = localStorage.getItem("teamName")
    const userProfile = localStorage.getItem("userProfile")
    const surveyResponses = localStorage.getItem("surveyResponses")
    
    if (!teamName) {
      router.push("/team-setup")
      return
    }
    
    if (!userProfile) {
      router.push("/profile")
      return
    }
    
    if (!surveyResponses) {
      router.push("/survey")
      return
    }
  }, [router])

  // Carregar respostas salvas, se existirem
  useEffect(() => {
    if (surveyContext.openQuestionResponses) {
      form.reset({
        q13: surveyContext.openQuestionResponses.q13,
        q14: surveyContext.openQuestionResponses.q14,
      })
    } else {
      // Tentar carregar do localStorage para compatibilidade com código existente
      const savedOpenResponses = localStorage.getItem("openQuestionsResponses")
      if (savedOpenResponses) {
        try {
          const parsedResponses = JSON.parse(savedOpenResponses)
          form.reset(parsedResponses)
        } catch (e) {
          console.error("Erro ao carregar respostas salvas:", e)
        }
      }
    }
  }, [surveyContext.openQuestionResponses, form])

  // Exibir mensagem de erro se houver
  useEffect(() => {
    if (surveyContext.error) {
      toast({
        title: "Erro",
        description: surveyContext.error,
        variant: "destructive",
      })
    }
  }, [surveyContext.error, toast])

  // Função para lidar com o envio do formulário
  const onSubmit = async (data: OpenQuestionsFormValues) => {
    try {
      setIsSubmitting(true)
      
      // Salvar no banco de dados
      const result = await surveyContext.saveOpenQuestionResponses(data)
      
      if (result) {
        // Salvar no localStorage para compatibilidade com o código existente
        localStorage.setItem("openQuestionsResponses", JSON.stringify(data))
        
        // Marcar como completo no banco de dados e atualizar status do membro
        const completed = await surveyContext.completeAllSteps()
        
        // Marcar como respondido no localStorage
        const teamId = localStorage.getItem("teamId")
        if (teamId) {
          localStorage.setItem(`surveyCompleted_${teamId}`, "true")
        }
        localStorage.setItem("surveyCompleted", "true")
        
        toast({
          title: "Respostas salvas",
          description: "Suas respostas foram salvas com sucesso!",
        })
        
        // Redirecionar para a página de resultados
        router.push("/results")
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar respostas",
        description: error.message || "Ocorreu um erro ao salvar suas respostas.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span className="text-muted-foreground">Minha Equipe</span>
            <span className="text-muted-foreground">Meu Perfil</span>
            <span className="font-bold">Radar das Competências de Liderança 4.0</span>
            <span className="text-muted-foreground">Resultados</span>
          </div>
          <Progress value={90} className="h-2" />
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">Perguntas Abertas</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Compartilhe sua opinião</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {questions.map((question) => (
                  <FormField
                    key={question.id}
                    control={form.control}
                    name={question.id as keyof OpenQuestionsFormValues}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">{question.competence}</FormLabel>
                        <FormDescription>{question.question}</FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Digite sua resposta aqui..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/survey")}>
              Voltar
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting || surveyContext.loading}
            >
              {isSubmitting ? "Salvando..." : "Finalizar e Ver Resultados"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  )
}

