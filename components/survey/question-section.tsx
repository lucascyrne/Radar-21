'use client';

import { useState, MutableRefObject, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { FormItem } from '@/components/ui/form';
import { useSurvey } from '@/resources/survey/survey-hook';
import { SurveyResponses } from '@/resources/survey/survey-model';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Interfaces para os dados de questão
export interface Question {
  id: string;
  question: string;
  competency: string;
}

// Opções da escala Likert
const likertOptions = [
  { value: '1', label: '1 - Discordo totalmente' },
  { value: '2', label: '2 - Discordo parcialmente' },
  { value: '3', label: '3 - Neutro' },
  { value: '4', label: '4 - Concordo parcialmente' },
  { value: '5', label: '5 - Concordo totalmente' },
];

interface QuestionSectionProps {
  questions: Question[];
  answeredSet: MutableRefObject<Set<string>>;
  onAnswerUpdate: (questionId: string) => void;
}

const getContextualHint = (competency: string): string => {
  const hints: Record<string, string> = {
    'q1': 'Reflita sobre a qualidade e frequência das trocas de feedback em sua equipe. Como isso impacta o desenvolvimento e crescimento do time?\n\nConsidere suas experiências práticas no ambiente de trabalho ao responder esta questão.',
    'q2': 'Pense em situações onde você precisou tomar decisões rápidas ou adaptar estratégias. Como você lidou com os riscos e aprendizados?\n\nConsidere suas experiências práticas no ambiente de trabalho ao responder esta questão.',
    'q3': 'Avalie o nível de confiança entre você e sua equipe. Como isso afeta a delegação de tarefas e a autonomia do time?\n\nConsidere suas experiências práticas no ambiente de trabalho ao responder esta questão.',
    'q4': 'Lembre-se de momentos onde a compreensão mútua foi crucial. Como a empatia influencia suas relações profissionais?\n\nConsidere suas experiências práticas no ambiente de trabalho ao responder esta questão.',
    'q5': 'Pense em como você aproveita as diferentes habilidades de sua equipe. Como isso contribui para o sucesso dos projetos?\n\nConsidere suas experiências práticas no ambiente de trabalho ao responder esta questão.',
    'q6': 'Reflita sobre momentos de mudança inesperada. Como sua capacidade de adaptação influenciou os resultados?\n\nConsidere suas experiências práticas no ambiente de trabalho ao responder esta questão.',
    'q7': 'Avalie como você incentiva novas ideias no trabalho. Qual o impacto da inovação no desenvolvimento da equipe?\n\nConsidere suas experiências práticas no ambiente de trabalho ao responder esta questão.',
    'q8': 'Pense nos diferentes canais e formas de comunicação que utiliza. Como isso afeta a eficiência do trabalho?\n\nConsidere suas experiências práticas no ambiente de trabalho ao responder esta questão.',
    'q9': 'Reflita sobre o processo de tomada de decisão em sua equipe. Como o compartilhamento de responsabilidades afeta os resultados?\n\nConsidere suas experiências práticas no ambiente de trabalho ao responder esta questão.',
    'q10': 'Avalie situações onde sua equipe precisou se reorganizar. Como a auto-organização contribuiu para resolver desafios?\n\nConsidere suas experiências práticas no ambiente de trabalho ao responder esta questão.',
    'q11': 'Pense em projetos que exigiram esforço coletivo. Como o trabalho colaborativo impactou o resultado final?\n\nConsidere suas experiências práticas no ambiente de trabalho ao responder esta questão.',
    'q12': 'Reflita sobre obstáculos que enfrentou. Como sua atitude diante dos desafios influencia sua equipe?\n\nConsidere suas experiências práticas no ambiente de trabalho ao responder esta questão.',
    'default': 'Considere suas experiências práticas no ambiente de trabalho ao responder esta questão.'
  };

  return hints[competency] || hints.default;
};

export function QuestionSection({ questions, answeredSet, onAnswerUpdate }: QuestionSectionProps) {
  const { surveyResponses, saveAnswers } = useSurvey();
  const { toast } = useToast();
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>(() => {
    console.log('Inicializando respostas locais:', {
      hasResponses: !!surveyResponses,
      responses: surveyResponses
    });
    
    const initialAnswers: Record<string, string> = {};
    if (surveyResponses) {
      questions.forEach(q => {
        const value = surveyResponses[q.id];
        if (value !== undefined && value !== null) {
          initialAnswers[q.id] = value.toString();
          answeredSet.current.add(q.id);
          onAnswerUpdate(q.id);
        }
      });
    }
    console.log('Respostas iniciais:', initialAnswers);
    return initialAnswers;
  });

  const handleAnswerChange = async (questionId: string, value: string) => {
    try {
      console.log('Alterando resposta:', {
        questionId,
        value,
        previousAnswers: localAnswers
      });
      
      // Atualizar estado local imediatamente
      const newAnswers = { ...localAnswers, [questionId]: value };
      setLocalAnswers(newAnswers);
      
      answeredSet.current.add(questionId);
      onAnswerUpdate(questionId);
      
      // Converter respostas para números
      const numericAnswers = Object.entries(newAnswers).reduce<SurveyResponses>((acc, [key, val]) => {
        const numValue = parseInt(val, 10);
        if (!isNaN(numValue)) {
          acc[key] = numValue;
        }
        return acc;
      }, {});
      
      // Salvar em segundo plano
      saveAnswers(numericAnswers).catch(error => {
        console.error('Erro ao salvar resposta:', error);
        // Em caso de erro, manter a resposta local mas notificar o usuário
        toast({
          title: "Erro ao salvar resposta",
          description: "Sua resposta foi registrada localmente, mas houve um erro ao salvá-la. As respostas serão sincronizadas automaticamente.",
          variant: "destructive",
        });
      });
    } catch (error) {
      console.error('Erro ao processar resposta:', error);
    }
  };

  // Log quando as questões ou respostas mudarem
  useEffect(() => {
    console.log('Estado atual do QuestionSection:', {
      questionsCount: questions.length,
      answeredCount: Object.keys(localAnswers).length,
      answeredSetSize: answeredSet.current.size
    });
  }, [questions, localAnswers]);

  return (
    <div className="space-y-8">
      {questions.map(question => (
        <Card key={question.id} className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <p className="text-base flex-1">{question.question}</p>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="shrink-0 h-8 w-8 border-2 border-primary hover:bg-primary/10 touch-manipulation"
                      aria-label="Dica para responder a questão"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span className="sr-only">Dica contextual</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="right" 
                    align="center"
                    className="max-w-[300px] p-4 text-sm bg-popover border-2 shadow-lg"
                    sideOffset={5}
                  >
                    <p className="text-muted-foreground">
                      {getContextualHint(question.competency)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <FormItem className="space-y-3">
              <RadioGroup
                value={localAnswers[question.id] || ''}
                onValueChange={(value) => handleAnswerChange(question.id, value)}
                className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4 flex-wrap"
              >
                {likertOptions.map(option => (
                  <div key={option.value} className="flex items-center space-x-2 space-y-0 mb-2">
                    <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                    <Label htmlFor={`${question.id}-${option.value}`} className="font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </FormItem>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 