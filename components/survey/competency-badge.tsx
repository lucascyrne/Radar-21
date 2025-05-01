"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface CompetencyBadgeProps {
  competency: string;
  description: string;
  value?: number;
  teamValue?: number;
  leaderValue?: number;
}

const competencyDescriptions: Record<string, string> = {
  "Liderança Digital":
    "Capacidade de liderar equipes e projetos em um contexto digital, utilizando tecnologias e metodologias ágeis.",
  "Pensamento Sistêmico":
    "Habilidade de compreender sistemas complexos e suas interrelações no contexto da Indústria 4.0.",
  Inovação:
    "Capacidade de promover e implementar inovações tecnológicas e processuais.",
  "Gestão da Mudança":
    "Habilidade de gerenciar transformações organizacionais e culturais.",
  "Tomada de Decisão":
    "Capacidade de tomar decisões baseadas em dados e análises complexas.",
  "Comunicação Digital":
    "Habilidade de comunicar-se efetivamente através de meios digitais.",
  "Colaboração Virtual":
    "Capacidade de trabalhar e liderar equipes em ambientes virtuais.",
  "Aprendizagem Contínua":
    "Disposição e capacidade de aprender e se adaptar constantemente.",
  "Resiliência Digital":
    "Capacidade de adaptar-se e recuperar-se de desafios no ambiente digital.",
  "Mentalidade Digital":
    "Compreensão e adaptação ao contexto digital e suas implicações.",
  "Gestão de Dados":
    "Capacidade de trabalhar com dados e analytics para tomada de decisão.",
  "Segurança Digital":
    "Compreensão e aplicação de práticas de segurança digital.",
};

export function CompetencyBadge({
  competency,
  description,
  value,
  teamValue,
  leaderValue,
}: CompetencyBadgeProps) {
  const defaultDescription = competencyDescriptions[competency] || description;

  // Calcular a diferença entre equipe e líder (positivo quando equipe > líder)
  const difference =
    teamValue !== undefined && leaderValue !== undefined
      ? Number((teamValue - leaderValue).toFixed(1))
      : undefined;

  // Determinar a classe CSS com base na diferença
  const getDifferenceClass = (diff: number | undefined) => {
    if (diff === undefined) return "";
    if (diff > 0.5) return "text-green-600 font-medium";
    if (diff < -0.5) return "text-red-600 font-medium";
    return "text-orange-500 font-medium";
  };

  // Determinar o texto de status com base na diferença
  const getDifferenceStatus = (diff: number | undefined) => {
    if (diff === undefined) return "Não disponível";
    if (diff > 0.5) return "Equipe avalia melhor";
    if (diff < -0.5) return "Líder avalia melhor";
    return "Avaliações similares";
  };

  return (
    <Card className="relative overflow-hidden">
      {difference !== undefined && (
        <div
          className={`absolute top-0 right-0 w-3 h-full ${
            difference > 0.5
              ? "bg-green-600"
              : difference < -0.5
              ? "bg-red-600"
              : "bg-orange-500"
          }`}
        />
      )}

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
            <span className="text-sm text-muted-foreground">
              Sua avaliação:
            </span>
            <span className="font-medium">{value.toFixed(1)}</span>
          </div>
        )}

        {teamValue !== undefined && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              Média da equipe:
            </span>
            <span className="font-medium text-green-600">
              {teamValue.toFixed(1)}
            </span>
          </div>
        )}

        {leaderValue !== undefined && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              Avaliação do líder:
            </span>
            <span className="font-medium text-blue-600">
              {leaderValue.toFixed(1)}
            </span>
          </div>
        )}

        {difference !== undefined && (
          <>
            <div className="flex justify-between pt-2 mt-1 border-t">
              <span className="text-sm text-muted-foreground">Diferença:</span>
              <span className={getDifferenceClass(difference)}>
                {difference > 0 ? "+" : ""}
                {difference}
              </span>
            </div>
            <div className="text-xs text-center pt-1 pb-1 rounded-sm bg-gray-50">
              <span className={getDifferenceClass(difference)}>
                {getDifferenceStatus(difference)}
              </span>
            </div>
          </>
        )}

        {/* Visualização em barras */}
        {teamValue !== undefined && leaderValue !== undefined && (
          <div className="pt-2 space-y-2">
            <div className="space-y-1">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(teamValue / 5) * 100}%` }}
                ></div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(leaderValue / 5) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Equipe</span>
              <span>Líder</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
