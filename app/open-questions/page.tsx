"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

const openQuestions = [
  {
    id: 13,
    competence: "Ambiente de Trabalho",
    question:
      "Na sua opinião, o que poderia ser melhorado no ambiente de trabalho físico ou psicológico, ou nas relações profissionais dentro da equipe ou com a gestão?",
  },
  {
    id: 14,
    competence: "Formação",
    question:
      "Na sua opinião, como a universidade poderia ter lhe preparado melhor para os desafios profissionais que você enfrentou após a graduação?",
  },
]

export default function OpenQuestions() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  useEffect(() => {
    // Check if survey was completed
    const surveyAnswers = localStorage.getItem("surveyAnswers")
    if (!surveyAnswers) {
      router.push("/survey")
      return
    }

    // Load open question answers if they exist
    const savedAnswers = localStorage.getItem("openQuestionAnswers")
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers))
    }
  }, [router])

  const handleChange = (value: string) => {
    const newAnswers = { ...answers, [openQuestions[currentQuestion].id]: value }
    setAnswers(newAnswers)
    localStorage.setItem("openQuestionAnswers", JSON.stringify(newAnswers))
  }

  const handleNext = () => {
    if (currentQuestion < openQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // All questions answered, navigate to results page
      router.push("/results")
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const progress = ((currentQuestion + 1) / openQuestions.length) * 100

  return (
    <div className="container max-w-3xl py-12">
      <div className="mb-8">
        <div className="flex justify-between mb-2 text-sm font-medium">
          <span className="text-muted-foreground">Minha Equipe</span>
          <span className="text-muted-foreground">Meu Perfil</span>
          <span className="font-bold">Questionário das Competências de Liderança 4.0</span>
          <span className="text-muted-foreground">Resultados</span>
        </div>
        <Progress value={90} className="h-2" />
      </div>

      <h1 className="text-3xl font-bold mb-8 text-center">Perguntas Abertas</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            Pergunta {currentQuestion + 1} de {openQuestions.length}
          </CardTitle>
          <CardDescription>Compartilhe suas experiências e opiniões sobre os temas abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">{openQuestions[currentQuestion].competence}</h3>
              <p className="text-lg mb-4">{openQuestions[currentQuestion].question}</p>
            </div>

            <Textarea
              value={answers[openQuestions[currentQuestion].id] || ""}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Digite sua resposta aqui..."
              rows={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
            Anterior
          </Button>
          <Button onClick={handleNext} disabled={!answers[openQuestions[currentQuestion].id]}>
            {currentQuestion < openQuestions.length - 1 ? "Próxima" : "Finalizar"}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8">
        <Progress value={progress} className="h-2 mb-2" />
        <div className="text-sm text-muted-foreground text-center">{Math.round(progress)}% completo</div>
      </div>
    </div>
  )
}

