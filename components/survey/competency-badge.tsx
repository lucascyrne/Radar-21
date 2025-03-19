'use client';

import { HelpCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CompetencyBadgeProps {
  competency: string
  description: string
  value?: number
  teamValue?: number
  leaderValue?: number
}

const competencyDescriptions: Record<string, string> = {
  'Liderança Digital': 'Capacidade de liderar equipes e projetos em um contexto digital, utilizando tecnologias e metodologias ágeis.',
  'Pensamento Sistêmico': 'Habilidade de compreender sistemas complexos e suas interrelações no contexto da Indústria 4.0.',
  'Inovação': 'Capacidade de promover e implementar inovações tecnológicas e processuais.',
  'Gestão da Mudança': 'Habilidade de gerenciar transformações organizacionais e culturais.',
  'Tomada de Decisão': 'Capacidade de tomar decisões baseadas em dados e análises complexas.',
  'Comunicação Digital': 'Habilidade de comunicar-se efetivamente através de meios digitais.',
  'Colaboração Virtual': 'Capacidade de trabalhar e liderar equipes em ambientes virtuais.',
  'Aprendizagem Contínua': 'Disposição e capacidade de aprender e se adaptar constantemente.',
  'Resiliência Digital': 'Capacidade de adaptar-se e recuperar-se de desafios no ambiente digital.',
  'Mentalidade Digital': 'Compreensão e adaptação ao contexto digital e suas implicações.',
  'Gestão de Dados': 'Capacidade de trabalhar com dados e analytics para tomada de decisão.',
  'Segurança Digital': 'Compreensão e aplicação de práticas de segurança digital.'
};

export function CompetencyBadge({
  competency,
  description,
  value,
  teamValue,
  leaderValue
}: CompetencyBadgeProps) {
  const defaultDescription = competencyDescriptions[competency] || description;
  
  // Calcular a diferença entre equipe e líder (positivo quando equipe > líder)
  const difference = teamValue !== undefined && leaderValue !== undefined 
    ? Number((teamValue - leaderValue).toFixed(1))
    : undefined

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium">{competency}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{defaultDescription}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-xs line-clamp-2">
          {defaultDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {value !== undefined && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Sua avaliação:</span>
            <span className="font-medium">{value.toFixed(1)}</span>
          </div>
        )}
        
        {teamValue !== undefined && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Média da equipe:</span>
            <span className="font-medium">{teamValue.toFixed(1)}</span>
          </div>
        )}
        
        {leaderValue !== undefined && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Avaliação da liderança:</span>
            <span className="font-medium">{leaderValue.toFixed(1)}</span>
          </div>
        )}
        
        {difference !== undefined && (
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-sm text-muted-foreground">Diferença (Equipe - Líder):</span>
            <span className={`font-medium ${
              difference > 0 
                ? 'text-green-600' 
                : difference < 0 
                  ? 'text-red-600' 
                  : ''
            }`}>
              {difference}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 