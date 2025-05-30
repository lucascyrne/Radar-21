"use client";

import { Layout } from "@/components/layout";
import { QuestionSection } from "@/components/survey/question-section";
import { withSurveyProgress } from "@/components/survey/survey-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/resources/auth/auth-hook";
import { useSurvey } from "@/resources/survey/survey-hook";
import { useTeam } from "@/resources/team/team-hook";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface SurveyPageProps {
  surveyProgress?: {
    hasProfile: boolean;
    hasSurvey: boolean;
    hasOpenQuestions: boolean;
  };
  progressPercentage?: number;
}

function SurveyPage({
  progressPercentage = 0,
}: SurveyPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedTeam, updateMemberStatus } = useTeam();
  const { questions, loading, error, answers, saveAnswers, loadData } =
    useSurvey();

  const [progress, setProgress] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const answeredRef = useRef(new Set<string>());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Log do estado inicial
  useEffect(() => {
    console.log("Estado atual da página:", {
      hasQuestions: !!questions,
      questionsLength: questions?.length,
      loading,
      error,
      hasAnswers: !!answers,
      answersLength: answers ? Object.keys(answers).length : 0,
    });
  }, [questions, loading, error, answers]);

  // Calcular progresso da pesquisa
  useEffect(() => {
    if (!questions?.length) {
      console.log("Sem questões disponíveis para calcular progresso");
      return;
    }

    const totalQuestions = questions.length;
    const calculatedProgress = (answeredCount / totalQuestions) * 100;
    console.log("Progresso atualizado:", {
      totalQuestions,
      answeredCount,
      calculatedProgress,
      answeredRefSize: answeredRef.current.size,
    });
    setProgress(Math.round(calculatedProgress));
  }, [questions, answeredCount]);

  // Marcar respostas existentes
  useEffect(() => {
    console.log("Respostas atualizadas:", {
      hasAnswers: !!answers,
      answersLength: answers ? Object.keys(answers).length : 0,
    });

    if (answers && Object.keys(answers).length > 0) {
      const answeredSet = new Set<string>();

      for (const [questionId, value] of Object.entries(answers)) {
        if (value !== null && value !== undefined) {
          answeredSet.add(questionId);
        }
      }

      console.log("Set de respostas atualizado:", {
        answeredSetSize: answeredSet.size,
        answers: Array.from(answeredSet),
      });

      answeredRef.current = answeredSet;
      setAnsweredCount(answeredSet.size);
    }
  }, [answers]);

  // Exibir mensagens de erro
  useEffect(() => {
    if (error.demographicData || error.survey || error.openQuestions) {
      toast.error(error.demographicData || error.survey || error.openQuestions);
    }
  }, [error, toast]);

  // Função para atualizar o progresso
  const updateProgress = useCallback((questionId: string) => {
    console.log("Atualizando progresso:", {
      questionId,
      previousSize: answeredRef.current.size,
    });

    answeredRef.current.add(questionId);
    setAnsweredCount(answeredRef.current.size);

    console.log("Progresso atualizado:", {
      newSize: answeredRef.current.size,
      answers: Array.from(answeredRef.current),
    });
  }, []);

  // Submeter respostas
  const handleSubmit = useCallback(async () => {
    if (!user?.email) {
      toast.error("Você precisa estar autenticado para enviar as respostas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const totalQuestions = questions.length;
      const answered = answeredRef.current.size;

      console.log("Tentando submeter:", {
        totalQuestions,
        answered,
        isLoading: loading,
        currentAnswers: answers,
        answeredQuestions: Array.from(answeredRef.current),
      });

      if (answered < totalQuestions) {
        const missingCount = totalQuestions - answered;
        toast.error(
          `Faltam ${missingCount} ${
            missingCount === 1 ? "pergunta" : "perguntas"
          } para completar.`
        );
        return;
      }

      if (!answers || Object.keys(answers).length === 0) {
        throw new Error("Nenhuma resposta encontrada para enviar");
      }

      // Dados do membro para atualização de status
      const teamId = selectedTeam?.id || localStorage.getItem("teamId");
      const userEmail = user?.email || localStorage.getItem("userEmail");

      if (!teamId || !userEmail) {
        throw new Error(
          "Dados de equipe ou usuário ausentes. Por favor, tente novamente."
        );
      }

      // Salvar respostas finais
      const result = await saveAnswers(answers);

      if (result) {
        // Atualizar status do membro
        await updateMemberStatus(teamId, userEmail, "answered");

        toast.success("Questionário concluído");

        router.push("/open-questions");
      } else {
        throw new Error(
          "Não foi possível salvar as respostas. Por favor, tente novamente."
        );
      }
    } catch (error: any) {
      console.error("Erro ao submeter:", error);
      toast.error(error.message || "Ocorreu um erro ao salvar suas respostas.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    questions,
    answers,
    saveAnswers,
    updateMemberStatus,
    toast,
    router,
    user?.email,
    selectedTeam?.id,
    loading,
  ]);

  // Log do estado atual sempre que relevante
  useEffect(() => {
    console.log("Estado atual:", {
      questionsLength: questions?.length,
      answeredCount,
      progress,
      isLoading: loading,
      answeredRefSize: answeredRef.current.size,
    });
  }, [questions, answeredCount, progress, loading]);

  useEffect(() => {
    if (!loading.survey) {
      loadData();
    }
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Progresso do Questionário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {progressPercentage}% concluído
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage / 33.33)} de 3 etapas
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Questionário de Competências
          </h1>
          <p className="text-muted-foreground">
            Avalie cada competência de acordo com sua experiência e percepção.
            Suas respostas são confidenciais e ajudarão a identificar áreas de
            desenvolvimento.
          </p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {loading.survey ? (
            <div className="text-center py-8">
              <p>Carregando questões...</p>
            </div>
          ) : error.survey ? (
            <div className="text-center py-8 text-destructive">
              <p>Erro ao carregar questões: {error.survey}</p>
            </div>
          ) : !questions?.length ? (
            <div className="text-center py-8">
              <p>Nenhuma questão disponível.</p>
            </div>
          ) : (
            <QuestionSection
              questions={questions.map((q) => ({
                id: q.id,
                question: q.text,
                competency: q.competency,
              }))}
              answeredSet={answeredRef}
              onAnswerUpdate={updateProgress}
            />
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSubmit}
              disabled={progress < 100 || isSubmitting || loading.survey}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Enviando..." : "Finalizar Pesquisa"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withSurveyProgress(SurveyPage);
