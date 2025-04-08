"use client"

import { HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompetencyDetail } from '@/resources/survey/survey-model';

interface TeamCompetencyDetailsProps {
  competencyDetails: CompetencyDetail[];
  isLoading: boolean;
}

export function TeamCompetencyDetails({ competencyDetails, isLoading }: TeamCompetencyDetailsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="h-12 w-full bg-gray-200 animate-pulse rounded-lg" />
        <div className="h-12 w-full bg-gray-200 animate-pulse rounded-lg" />
        <div className="h-12 w-full bg-gray-200 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (competencyDetails.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">
          Não há dados suficientes para exibir detalhes por competência. É necessário que o líder e pelo menos um membro da equipe tenham respondido o questionário.
        </p>
      </div>
    );
  }

  // Calcular média geral do líder e da equipe
  const leaderAvg = competencyDetails.reduce((acc, item) => acc + item.userScore, 0) / competencyDetails.length;
  const teamAvg = competencyDetails.reduce((acc, item) => acc + item.teamAverage, 0) / competencyDetails.length;
  const overallDiff = teamAvg - leaderAvg;

  return (
    <div className="space-y-8">
      {/* Resumo geral */}
      <div className="bg-gray-50 p-4 rounded-lg border mb-6">
        <h3 className="text-lg font-semibold mb-3">Resumo Geral</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-md border shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Avaliação do Líder</div>
            <div className="text-2xl font-bold text-blue-600">{leaderAvg.toFixed(1)}/5</div>
          </div>
          <div className="bg-white p-3 rounded-md border shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Média da Equipe</div>
            <div className="text-2xl font-bold text-green-600">{teamAvg.toFixed(1)}/5</div>
            <div className="text-xs text-gray-500">(excluindo líder)</div>
          </div>
          <div className="bg-white p-3 rounded-md border shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Diferença</div>
            <div className={`text-2xl font-bold ${overallDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallDiff > 0 ? '+' : ''}{overallDiff.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes por competência */}
      <div className="space-y-6">
        {competencyDetails.map((item) => (
          <div key={item.topic} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">{item.topic}</h3>
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <span className="text-blue-600 font-medium cursor-default">
                          Líder: {item.userScore}/5
                        </span>
                        <HelpCircle className="h-4 w-4 text-blue-600 cursor-help" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Avaliação do líder para esta competência.</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <span className="text-green-600 font-medium cursor-default">
                          Equipe: {item.teamAverage.toFixed(1)}/5
                        </span>
                        <HelpCircle className="h-4 w-4 text-green-600 cursor-help" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Média das avaliações dos membros da equipe (excluindo o líder).</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <span className={`font-medium cursor-default ${item.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Diferença: {item.difference > 0 ? '+' : ''}{item.difference.toFixed(1)}
                        </span>
                        <HelpCircle className={`h-4 w-4 cursor-help ${item.difference > 0 ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Diferença entre a média da equipe e a avaliação do líder.</p>
                      <p className="mt-1">
                        {item.difference > 0 
                          ? 'Valor positivo (verde) indica que a equipe avalia esta competência melhor que o líder.' 
                          : 'Valor negativo (vermelho) indica que a equipe avalia esta competência abaixo do líder.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {/* Barra do líder */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm font-medium">
                  <span>Avaliação do Líder</span>
                  <span>{item.userScore}/5</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${(item.userScore / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Barra da equipe */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm font-medium">
                  <span>Média da Equipe</span>
                  <span>{item.teamAverage.toFixed(1)}/5</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full"
                      style={{ width: `${(item.teamAverage / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Status da competência */}
              <div className="mt-2 flex flex-wrap gap-2">
                {item.difference > 0 ? (
                  <Badge 
                    className="transition-none pointer-events-none bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
                  >
                    Equipe avalia melhor que o líder (+{item.difference.toFixed(1)})
                  </Badge>
                ) : item.difference < 0 ? (
                  <Badge 
                    className="transition-none pointer-events-none bg-red-100 text-red-800 border-red-200 hover:bg-red-100"
                  >
                    Líder avalia melhor que a equipe ({item.difference.toFixed(1)})
                  </Badge>
                ) : (
                  <Badge 
                    className="transition-none pointer-events-none bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100"
                  >
                    Avaliação equalizada (0.0)
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 