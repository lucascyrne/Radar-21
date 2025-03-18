import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface ContinueButtonProps {
  onContinue: () => void;
  hasCompletedSurvey: boolean;
}

export function ContinueButton({ onContinue, hasCompletedSurvey }: ContinueButtonProps) {
  return (
    <div className="space-y-4">
      <Alert variant="default" className="bg-blue-50">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertDescription>
          {hasCompletedSurvey
            ? 'Você já respondeu à pesquisa. Clique em "Continuar" para ver os resultados.'
            : 'Clique em "Continuar" para responder à pesquisa de competências.'}
        </AlertDescription>
      </Alert>
      
      <Button onClick={onContinue} className="w-full">
        {hasCompletedSurvey ? 'Ver Resultados' : 'Continuar para a Pesquisa'}
      </Button>
    </div>
  );
} 