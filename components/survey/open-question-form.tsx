import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { openQuestionsSchema, OpenQuestionsFormValues } from "@/resources/survey/survey-model"

interface OpenQuestionFormProps {
  onSubmit: (data: OpenQuestionsFormValues) => Promise<void>
  isSubmitting: boolean
  defaultValues?: OpenQuestionsFormValues
}

const questions = [
  {
    id: "q13",
    competency: "Ambiente de Trabalho",
    question: "Na sua opinião, o que poderia ser melhorado no ambiente de trabalho físico ou psicológico, ou nas relações profissionais dentro da equipe ou com a gestão?",
  },
  {
    id: "q14",
    competency: "Formação",
    question: "Na sua opinião, como sua formação acadêmica poderia ter lhe preparado melhor para os desafios profissionais que você enfrenta? (Opcional)",
  },
]

export function OpenQuestionForm({ onSubmit, isSubmitting, defaultValues }: OpenQuestionFormProps) {
  const form = useForm<OpenQuestionsFormValues>({
    resolver: zodResolver(openQuestionsSchema),
    defaultValues: defaultValues || {
      q13: "",
      q14: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {questions.map((question) => (
          <Card key={question.id} className="p-6">
            <FormField
              control={form.control}
              name={question.id as keyof OpenQuestionsFormValues}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">{question.competency}</FormLabel>
                  <FormDescription className="text-base mb-4">{question.question}</FormDescription>
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
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Finalizar e Ver Resultados"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 