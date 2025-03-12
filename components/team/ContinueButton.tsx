import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../resources/auth/auth-hook';

interface ContinueButtonProps {
  nextPage?: string;
  isLastPage?: boolean;
  onBeforeContinue?: () => Promise<boolean> | boolean;
  className?: string;
}

export function ContinueButton({
  nextPage,
  isLastPage = false,
  onBeforeContinue,
  className = '',
}: ContinueButtonProps) {
  const router = useRouter();
  const { updateFormProgress, getNextFormPage } = useAuth();

  const handleContinue = async () => {
    // Se houver uma função a ser executada antes de continuar, execute-a
    if (onBeforeContinue) {
      const canContinue = await onBeforeContinue();
      if (!canContinue) return;
    }

    // Se for a última página, marque o formulário como completo
    if (isLastPage) {
      await updateFormProgress(nextPage || '', true);
      router.push('/resultados');
      return;
    }

    // Se uma próxima página for especificada, atualize o progresso e navegue para ela
    if (nextPage) {
      await updateFormProgress(nextPage);
      router.push(nextPage);
    } else {
      // Caso contrário, obtenha a próxima página do hook de autenticação
      const nextFormPage = getNextFormPage();
      router.push(nextFormPage);
    }
  };

  return (
    <Button 
      onClick={handleContinue} 
      className={`mt-4 ${className}`}
    >
      Continuar
    </Button>
  );
} 