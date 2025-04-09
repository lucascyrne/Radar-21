import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/resources/auth/auth-hook";
import { SurveyService } from "@/resources/survey/survey.service";
import { useTeam } from "@/resources/team/team-hook";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface SurveyProgressState {
  hasProfile: boolean;
  hasSurvey: boolean;
  hasOpenQuestions: boolean;
  isLoading: boolean;
}

// Componente Skeleton para o progresso
const SurveyProgressSkeleton = () => (
  <Card className="w-full">
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-9 w-[100px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const withSurveyProgress = (
  WrappedComponent: React.ComponentType<any>
) => {
  return function WithSurveyProgressComponent(props: any) {
    const router = useRouter();
    const { user } = useAuth();
    const { selectedTeam } = useTeam();
    const [progress, setProgress] = useState<SurveyProgressState>({
      hasProfile: false,
      hasSurvey: false,
      hasOpenQuestions: false,
      isLoading: true,
    });

    useEffect(() => {
      const checkProgress = async () => {
        try {
          if (!user?.id || !selectedTeam?.id) {
            setProgress((prev) => ({ ...prev, isLoading: false }));
            return;
          }

          const [profile, surveyResponses, openQuestions] = await Promise.all([
            SurveyService.loadDemographicData(user.id, selectedTeam.id),
            SurveyService.loadSurveyResponses(user.id, selectedTeam.id),
            SurveyService.loadOpenQuestions(user.id, selectedTeam.id),
          ]);

          setProgress({
            hasProfile: !!profile,
            hasSurvey: !!surveyResponses,
            hasOpenQuestions: !!openQuestions,
            isLoading: false,
          });
        } catch (error) {
          console.error("Erro ao verificar progresso:", error);
          toast.error(
            "Não foi possível verificar o progresso da sua pesquisa."
          );
          setProgress((prev) => ({ ...prev, isLoading: false }));
        }
      };

      checkProgress();
    }, [user?.id, selectedTeam?.id]);

    const handleContinueSurvey = () => {
      const { hasProfile, hasSurvey, hasOpenQuestions } = progress;

      if (!hasProfile) {
        router.push("/demographic-data");
      } else if (!hasSurvey) {
        router.push("/survey");
      } else if (!hasOpenQuestions) {
        router.push("/open-questions");
      } else {
        router.push("/results");
      }
    };

    // Calcular o progresso geral
    const calculateProgress = (): number => {
      const { hasProfile, hasSurvey, hasOpenQuestions } = progress;
      const steps = [hasProfile, hasSurvey, hasOpenQuestions];
      const completedSteps = steps.filter(Boolean).length;
      return Math.round((completedSteps / steps.length) * 100);
    };

    if (progress.isLoading) {
      return <SurveyProgressSkeleton />;
    }

    return (
      <WrappedComponent
        {...props}
        surveyProgress={progress}
        onContinueSurvey={handleContinueSurvey}
        progressPercentage={calculateProgress()}
      />
    );
  };
};
