'use client';

import { useState, useRef, MutableRefObject } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useSurvey } from '@/resources/survey/survey-hook';

// Interfaces para os dados de seção e questão
export interface Section {
  id: string;
  title: string;
  description?: string;
}

export interface Question {
  id: string;
  section_id: string;
  question: string;
  competence: string;
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
  section: Section;
  questions: Question[];
  answeredSet: MutableRefObject<Set<string>>;
}

export function QuestionSection({ section, questions, answeredSet }: QuestionSectionProps) {
  const { surveyResponses, saveSurveyResponses, isLoading } = useSurvey();
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    // Inicializar com respostas existentes, se houver
    const initialAnswers: Record<string, string> = {};
    if (surveyResponses) {
      questions.forEach(q => {
        const value = surveyResponses[q.id];
        if (value !== undefined && value !== null) {
          initialAnswers[q.id] = value.toString();
          answeredSet.current.add(q.id);
        }
      });
    }
    return initialAnswers;
  });

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Atualizar o conjunto de perguntas respondidas
    answeredSet.current.add(questionId);
    
    // Salvar automaticamente após cada resposta
    const updatedAnswers = { ...answers, [questionId]: value };
    saveSurveyResponses(updatedAnswers as any);
  };

  return (
    <div className="space-y-8">
      {section.description && (
        <p className="text-muted-foreground mb-6">{section.description}</p>
      )}
      
      {questions.map(question => (
        <Card key={question.id} className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{question.competence}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormItem className="space-y-3">
              <FormDescription className="text-base">{question.question}</FormDescription>
              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={(value) => handleAnswerChange(question.id, value)}
                className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4 flex-wrap"
                disabled={isLoading}
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