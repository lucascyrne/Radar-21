"use client"

import { useEffect, useState, useCallback } from "react"
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
  
  // Usar o hook de survey
  const surveyContext = useSurvey()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(90)

  // Inicializar o formulário com react-hook-form
  const form = useForm<OpenQuestionsFormValues>({
    resolver: zodResolver(openQuestionsSchema),
    defaultValues: {
      q13: "",
      q14: "",
    },
  })

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
  const handleSubmit = useCallback(async (data: OpenQuestionsFormValues) => {
    // Obter o ID do membro da equipe do contexto ou do localStorage
    const memberId = surveyContext.teamMemberId || localStorage.getItem("teamMemberId");
    
    if (!memberId) {
      toast({
        title: "Erro ao enviar respostas",
        description: "ID do membro da equipe não encontrado. Por favor, tente novamente.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Salvar respostas - agora passando apenas os dados
      await surveyContext.saveOpenQuestionResponses(data);
      
      // Atualizar progresso
      setProgress(100);

      toast({
        title: "Respostas salvas com sucesso!",
        description: "Todas as suas respostas foram salvas. Agora você pode ver os resultados.",
      });
      
      // Forçar um pequeno atraso antes do redirecionamento para garantir que o estado seja atualizado
      setTimeout(() => {
        // Redirecionar para a página de resultados
        router.push('/results');
      }, 500);
    } catch (error: any) {
      console.error('Erro ao enviar respostas:', error);
      toast({
        title: "Erro ao enviar respostas",
        description: error.message || "Ocorreu um erro ao enviar suas respostas. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [surveyContext, toast, router]);

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
          <Progress value={progress} className="h-2" />
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">Perguntas Abertas</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Compartilhe sua opinião</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
              onClick={form.handleSubmit(handleSubmit)}
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

