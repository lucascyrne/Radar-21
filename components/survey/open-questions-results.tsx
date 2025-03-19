import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OpenQuestionResponse } from "@/resources/survey/survey-model"

interface OpenQuestionsResultsProps {
  data: OpenQuestionResponse
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
    question: "Na sua opinião, como a universidade poderia ter lhe preparado melhor para os desafios profissionais que você enfrentou após a graduação?",
  },
]

export function OpenQuestionsResults({ data }: OpenQuestionsResultsProps) {
  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle>{question.competency}</CardTitle>
            <CardDescription>{question.question}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{data[question.id as keyof typeof data] || "Sem resposta"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 