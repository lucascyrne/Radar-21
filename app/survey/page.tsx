"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Layout } from "@/components/layout"

const questions = [
  {
    id: 1,
    competence: "Abertura",
    question:
      "O ambiente de trabalho facilita o feedback positivo ou negativo de mão dupla entre o líder e os membros da equipe?",
  },
  {
    id: 2,
    competence: "Agilidade",
    question:
      "No ambiente de trabalho, você age e reage rapidamente, assume riscos, considera diferentes cenários, experimenta ideias e aprende com as falhas?",
  },
  {
    id: 3,
    competence: "Confiança",
    question:
      "No ambiente de trabalho, você acredita que a relação profissional entre o líder e a equipe é baseada na confiança mútua?",
  },
  {
    id: 4,
    competence: "Empatia",
    question:
      "Nas relações profissionais, você compreende, tem empatia e considera a perspectiva e os sentimentos dos outros, e percebe que o mesmo é recíproco?",
  },
  {
    id: 5,
    competence: "Articulação",
    question:
      "No ambiente de trabalho, as conexões entre as competências dos membros da equipe e as externas ao squad/projeto são potencializadas, maximizadas e bem utilizadas?",
  },
  {
    id: 6,
    competence: "Adaptabilidade",
    question:
      "No ambiente de trabalho, você consegue se adaptar rapidamente e responder às adversidades que ocorrem em situações não planejadas?",
  },
  {
    id: 7,
    competence: "Inovação",
    question:
      "O ambiente de trabalho favorece, estimula e desenvolve as competências necessárias para a busca da inovação nos indivíduos?",
  },
  {
    id: 8,
    competence: "Comunicação",
    question:
      "No ambiente de trabalho, a comunicação é facilitada e ocorre de forma fluida, permitindo que você se comunique interna e externamente através de várias formas e canais?",
  },
  {
    id: 9,
    competence: "Descentralização",
    question:
      "No ambiente de trabalho diário, a tomada de decisão é participativa e compartilhada entre a gestão e a equipe, em vez de concentrada em uma pessoa?",
  },
  {
    id: 10,
    competence: "Auto-organização",
    question:
      "No ambiente de trabalho, a equipe se auto-organiza e se esforça coletivamente para resolver uma tarefa complexa ou um desafio inesperado?",
  },
  {
    id: 11,
    competence: "Colaboração",
    question:
      "No ambiente de trabalho, os desafios são tratados de forma colaborativa, aproveitando efetivamente as competências individuais dos membros da equipe?",
  },
  {
    id: 12,
    competence: "Resiliência",
    question:
      "No ambiente de trabalho, você considera que mantém uma atitude positiva, proativa e de aprendizado diante de obstáculos e fracassos?",
  },
]

export default function Survey() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)

  useEffect(() => {
    const profile = localStorage.getItem("userProfile")
    if (!profile) {
      router.push("/profile")
    }

    const savedAnswers = localStorage.getItem("surveyAnswers")
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers))
    }
  }, [router])

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [questions[currentQuestion].id]: Number.parseInt(value) }
    setAnswers(newAnswers)
    localStorage.setItem("surveyAnswers", JSON.stringify(newAnswers))

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      router.push("/open-questions")
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span className="text-muted-foreground">Minha Equipe</span>
            <span className="text-muted-foreground">Meu Perfil</span>
            <span className="font-bold">Questionário das Competências de Liderança 4.0</span>
            <span className="text-muted-foreground">Resultados</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">Questionário de Competências da Liderança 4.0</h1>

        <Card>
          <CardHeader>
            <CardTitle>
              Pergunta {currentQuestion + 1} de {questions.length}
            </CardTitle>
            <CardDescription>Avalie cada afirmação de acordo com o quanto você concorda ou discorda.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">{questions[currentQuestion].competence}</h3>
                <p className="text-lg">{questions[currentQuestion].question}</p>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { value: "1", label: "Discordo totalmente" },
                  { value: "2", label: "Discordo parcialmente" },
                  { value: "3", label: "Neutro" },
                  { value: "4", label: "Concordo parcialmente" },
                  { value: "5", label: "Concordo totalmente" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      answers[questions[currentQuestion].id]?.toString() === option.value ? "default" : "outline"
                    }
                    className="flex flex-col items-center justify-center h-20"
                    onClick={() => handleAnswer(option.value)}
                  >
                    <span className="text-lg font-bold">{option.value}</span>
                    <span className="text-xs text-center mt-1">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
              Anterior
            </Button>
            <div className="text-sm text-muted-foreground">
              {Object.keys(answers).length} de {questions.length} respondidas
            </div>
          </CardFooter>
        </Card>

        <div className="mt-8">
          <Progress value={progress} className="h-2 mb-2" />
          <div className="text-sm text-muted-foreground text-center">{Math.round(progress)}% completo</div>
        </div>
      </div>
    </Layout>
  )
}

