"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Layout } from "@/components/layout"
import { useToast } from "@/hooks/use-toast"
import { useSurvey } from "@/resources/survey/survey-hook"
import { surveySchema, SurveyFormValues } from "@/resources/survey/survey-model"
import { useAuth } from "@/resources/auth/auth-hook"

// Definição das perguntas do questionário
const questions = [
  {
    id: "q1",
    competence: "Abertura",
    question: "O ambiente de trabalho facilita o feedback positivo ou negativo de mão dupla entre o líder e os membros da equipe?",
  },
  {
    id: "q2",
    competence: "Agilidade",
    question: "No ambiente de trabalho, você age e reage rapidamente, assume riscos, considera diferentes cenários, experimenta ideias e aprende com as falhas?",
  },
  {
    id: "q3",
    competence: "Confiança",
    question: "No ambiente de trabalho, você acredita que a relação profissional entre o líder e a equipe é baseada na confiança mútua?",
  },
  {
    id: "q4",
    competence: "Empatia",
    question: "Nas relações profissionais, você compreende, tem empatia e considera a perspectiva e os sentimentos dos outros, e percebe que o mesmo é recíproco?",
  },
  {
    id: "q5",
    competence: "Articulação",
    question: "No ambiente de trabalho, as conexões entre as competências dos membros da equipe e as externas ao squad/projeto são potencializadas, maximizadas e bem utilizadas?",
  },
  {
    id: "q6",
    competence: "Adaptabilidade",
    question: "No ambiente de trabalho, você consegue se adaptar rapidamente e responder às adversidades que ocorrem em situações não planejadas?",
  },
  {
    id: "q7",
    competence: "Inovação",
    question: "O ambiente de trabalho favorece, estimula e desenvolve as competências necessárias para a busca da inovação nos indivíduos?",
  },
  {
    id: "q8",
    competence: "Comunicação",
    question: "No ambiente de trabalho, a comunicação é facilitada e ocorre de forma fluida, permitindo que você se comunique interna e externamente através de várias formas e canais?",
  },
  {
    id: "q9",
    competence: "Descentralização",
    question: "No ambiente de trabalho diário, a tomada de decisão é participativa e compartilhada entre a gestão e a equipe, em vez de concentrada em uma pessoa?",
  },
  {
    id: "q10",
    competence: "Auto-organização",
    question: "No ambiente de trabalho, a equipe se auto-organiza e se esforça coletivamente para resolver uma tarefa complexa ou um desafio inesperado?",
  },
  {
    id: "q11",
    competence: "Colaboração",
    question: "No ambiente de trabalho, os desafios são tratados de forma colaborativa, aproveitando efetivamente as competências individuais dos membros da equipe?",
  },
  {
    id: "q12",
    competence: "Resiliência",
    question: "No ambiente de trabalho, você considera que mantém uma atitude positiva, proativa e de aprendizado diante de obstáculos e fracassos?",
  },
]

// Opções da escala Likert
const likertOptions = [
  { value: "1", label: "1 - Discordo totalmente" },
  { value: "2", label: "2 - Discordo parcialmente" },
  { value: "3", label: "3 - Neutro" },
  { value: "4", label: "4 - Concordo parcialmente" },
  { value: "5", label: "5 - Concordo totalmente" },
]

export default function Survey() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { saveSurveyResponses, surveyResponses, error } = useSurvey()
  const [currentStep, setCurrentStep] = useState(1)
  const [progress, setProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inicializar o formulário com react-hook-form
  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      q1: "",
      q2: "",
      q3: "",
      q4: "",
      q5: "",
      q6: "",
      q7: "",
      q8: "",
      q9: "",
      q10: "",
      q11: "",
      q12: "",
    },
  })

  // Verificar se o usuário completou as etapas anteriores
  useEffect(() => {
    const userProfile = localStorage.getItem("userProfile")
    
    if (!userProfile) {
      router.push("/profile")
      return
    }
  }, [router])

  // Carregar respostas salvas, se existirem
  useEffect(() => {
    if (surveyResponses) {
      form.reset({
        q1: surveyResponses.q1?.toString() || "",
        q2: surveyResponses.q2?.toString() || "",
        q3: surveyResponses.q3?.toString() || "",
        q4: surveyResponses.q4?.toString() || "",
        q5: surveyResponses.q5?.toString() || "",
        q6: surveyResponses.q6?.toString() || "",
        q7: surveyResponses.q7?.toString() || "",
        q8: surveyResponses.q8?.toString() || "",
        q9: surveyResponses.q9?.toString() || "",
        q10: surveyResponses.q10?.toString() || "",
        q11: surveyResponses.q11?.toString() || "",
        q12: surveyResponses.q12?.toString() || "",
      })
      
      // Calcular o progresso com base nas respostas carregadas
      const answeredQuestions = Object.values(surveyResponses).filter(val => val !== null && val !== undefined).length
      setProgress((answeredQuestions / questions.length) * 100)
    } else {
      // Tentar carregar do localStorage para compatibilidade com código existente
      const savedResponses = localStorage.getItem("surveyResponses")
      if (savedResponses) {
        try {
          const parsedResponses = JSON.parse(savedResponses)
          form.reset(parsedResponses)
          
          // Calcular o progresso com base nas respostas salvas
          const answeredQuestions = Object.values(parsedResponses).filter(val => val !== "").length
          setProgress((answeredQuestions / questions.length) * 100)
        } catch (e) {
          console.error("Erro ao carregar respostas salvas:", e)
        }
      }
    }
  }, [surveyResponses, form])

  // Exibir mensagem de erro se houver
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  // Atualizar o progresso quando uma resposta é alterada
  useEffect(() => {
    const subscription = form.watch((value) => {
      const answeredQuestions = Object.values(value).filter(val => val !== "").length
      setProgress((answeredQuestions / questions.length) * 100)
    })
    
    return () => subscription.unsubscribe()
  }, [form])

  // Função para lidar com o envio do formulário
  const onSubmit = async (data: SurveyFormValues) => {
    try {
      setIsSubmitting(true)
      
      console.log("Enviando dados do formulário:", data);
      
      // Salvar no banco de dados
      const result = await saveSurveyResponses(data)
      
      if (result) {
        // Salvar no localStorage para compatibilidade com o código existente
        localStorage.setItem("surveyResponses", JSON.stringify(data))
        
        // Converter para o formato necessário para o gráfico radar
        const radarData = questions.map((q) => ({
          category: q.competence,
          value: parseInt(data[q.id as keyof SurveyFormValues], 10),
        }))
        
        localStorage.setItem("radarData", JSON.stringify(radarData))
        
        toast({
          title: "Respostas salvas",
          description: "Suas respostas foram salvas com sucesso!",
        })
        
        // Redirecionar para a próxima página
        router.push("/open-questions")
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

  // Função para navegar entre as etapas
  const handleStepChange = (step: number) => {
    if (step > 0 && step <= Math.ceil(questions.length / 4)) {
      setCurrentStep(step)
      window.scrollTo(0, 0)
    }
  }

  // Calcular quais perguntas mostrar na etapa atual
  const questionsPerStep = 4
  const startIndex = (currentStep - 1) * questionsPerStep
  const endIndex = Math.min(startIndex + questionsPerStep, questions.length)
  const currentQuestions = questions.slice(startIndex, endIndex)
  const totalSteps = Math.ceil(questions.length / questionsPerStep)

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
          <Progress value={75} className="h-2" />
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">Questionário de Competências da Liderança 4.0</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Parte {currentStep} de {totalSteps}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-6 h-2" />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {currentQuestions.map((question) => (
                  <FormField
                    key={question.id}
                    control={form.control}
                    name={question.id as keyof SurveyFormValues}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="font-bold">{question.competence}</FormLabel>
                        <FormDescription>{question.question}</FormDescription>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4 flex-wrap"
                          >
                            {likertOptions.map((option) => (
                              <FormItem key={option.value} className="flex items-center space-x-2 space-y-0 mb-2">
                                <FormControl>
                                  <RadioGroupItem value={option.value} />
                                </FormControl>
                                <FormLabel className="font-normal">{option.label}</FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
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
            {currentStep > 1 ? (
              <Button variant="outline" onClick={() => handleStepChange(currentStep - 1)}>
                Anterior
              </Button>
            ) : (
              <div></div>
            )}
            
            {currentStep < totalSteps ? (
              <Button onClick={() => handleStepChange(currentStep + 1)}>
                Próximo
              </Button>
            ) : (
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Finalizar e Continuar"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </Layout>
  )
}

