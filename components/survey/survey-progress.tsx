import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/resources/auth/auth-hook';
import { useTeam } from '@/resources/team/team-hook';
import { SurveyService } from '@/resources/survey/survey.service';
import { useToast } from '@/hooks/use-toast';

export interface SurveyProgressState {
  hasProfile: boolean;
  hasSurvey: boolean;
  hasOpenQuestions: boolean;
  isLoading: boolean;
}

export const withSurveyProgress = (WrappedComponent: React.ComponentType<any>) => {
  return function WithSurveyProgressComponent(props: any) {
    const router = useRouter();
    const { user } = useAuth();
    const { selectedTeam } = useTeam();
    const { toast } = useToast();
    const [progress, setProgress] = useState<SurveyProgressState>({
      hasProfile: false,
      hasSurvey: false,
      hasOpenQuestions: false,
      isLoading: true
    });

    useEffect(() => {
      const checkProgress = async () => {
        try {
          if (!user?.id || !selectedTeam?.id) {
            setProgress(prev => ({ ...prev, isLoading: false }));
            return;
          }

          const [profile, surveyResponses, openQuestions] = await Promise.all([
            SurveyService.loadProfile(user.id, selectedTeam.id),
            SurveyService.loadSurveyResponses(user.id, selectedTeam.id),
            SurveyService.loadOpenQuestions(user.id, selectedTeam.id)
          ]);

          setProgress({
            hasProfile: !!profile,
            hasSurvey: !!surveyResponses,
            hasOpenQuestions: !!openQuestions,
            isLoading: false
          });
        } catch (error) {
          console.error('Erro ao verificar progresso:', error);
          toast({
            title: "Erro ao verificar progresso",
            description: "Não foi possível verificar o progresso da sua pesquisa.",
            variant: "destructive"
          });
          setProgress(prev => ({ ...prev, isLoading: false }));
        }
      };

      checkProgress();
    }, [user?.id, selectedTeam?.id]);

    const handleContinueSurvey = () => {
      const { hasProfile, hasSurvey, hasOpenQuestions } = progress;

      if (!hasProfile) {
        router.push('/profile-survey');
      } else if (!hasSurvey) {
        router.push('/survey');
      } else if (!hasOpenQuestions) {
        router.push('/open-questions');
      } else {
        router.push('/results');
      }
    };

    // Calcular o progresso geral
    const calculateProgress = (): number => {
      const { hasProfile, hasSurvey, hasOpenQuestions } = progress;
      const steps = [hasProfile, hasSurvey, hasOpenQuestions];
      const completedSteps = steps.filter(Boolean).length;
      return Math.round((completedSteps / steps.length) * 100);
    };

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