'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/resources/auth/auth.service';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let authListener: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null;

    const handleAuth = async () => {
      try {
        // Verificar se já temos uma sessão válida
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
          if (isMounted) router.push('/team-setup');
          return;
        }

        // Configurar listener para capturar a sessão quando estiver pronta
        authListener = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (event === 'SIGNED_IN' && newSession) {
            if (isMounted) router.push('/team-setup');
          }
        });

      } catch (error) {
        console.error('Erro ao processar autenticação:', error);
        if (isMounted) {
          setError('Erro ao processar autenticação');
          setTimeout(() => router.push('/auth?error=callback_error'), 2000);
        }
      }
    };

    handleAuth();

    // Timeout de segurança
    const safetyTimeout = setTimeout(async () => {
      if (isMounted) {
        const { data: { session } } = await supabase.auth.getSession();
        router.push(session ? '/team-setup' : '/auth?error=timeout');
      }
    }, 5000);

    return () => {
      isMounted = false;
      authListener?.data.subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {error ? 'Erro na autenticação' : 'Processando autenticação...'}
        </h1>
        {error ? (
          <p className="text-red-500 mb-4">{error}</p>
        ) : (
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        )}
      </div>
    </div>
  );
} 