import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle } from "lucide-react"

interface SetupProgressProps {
  hasProfile: boolean
  hasSurvey: boolean
  hasOpenQuestions: boolean
  progress: number
  onContinue?: () => void
}

export function SetupProgress({
  hasProfile,
  hasSurvey,
  hasOpenQuestions,
  progress,
  onContinue
}: SetupProgressProps) {
  const steps = [
    {
      title: "Perfil",
      description: "Informações básicas do participante",
      isCompleted: hasProfile
    },
    {
      title: "Questionário",
      description: "Avaliação de competências",
      isCompleted: hasSurvey
    },
    {
      title: "Perguntas Abertas",
      description: "Feedback qualitativo",
      isCompleted: hasOpenQuestions
    }
  ]

  const getNextStep = () => {
    if (!hasProfile) return "perfil";
    if (!hasSurvey) return "questionário";
    if (!hasOpenQuestions) return "perguntas abertas";
    return "resultados";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso da Pesquisa</CardTitle>
        <CardDescription>
          {progress < 100
            ? `Continue de onde parou: ${getNextStep()}`
            : "Pesquisa concluída! Visualize seus resultados."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso geral</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Lista de etapas */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-start space-x-3">
              {step.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-medium leading-none">{step.title}</p>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Botão de continuar */}
        {progress < 100 && onContinue && (
          <Button 
            onClick={onContinue} 
            className="w-full"
          >
            Continuar Pesquisa
          </Button>
        )}
        
        {progress === 100 && onContinue && (
          <Button 
            onClick={onContinue} 
            className="w-full"
            variant="secondary"
          >
            Ver Resultados
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 