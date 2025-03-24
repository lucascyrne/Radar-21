'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/resources/auth/auth-hook';

export default function LogoutPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    let isMounted = true;
    
    const performLogout = async () => {
      try {
        // Executar logout
        await signOut();
        
        // Aguardar um momento para garantir que tudo seja limpo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se o componente ainda está montado antes de redirecionar
        if (isMounted) {
          router.replace('/auth');
        }
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        // Em caso de erro, ainda redirecionar para auth
        if (isMounted) {
          router.replace('/auth');
        }
      }
    };

    performLogout();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Saindo...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
} 