'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/resources/auth/auth-hook';

export default function LogoutPage() {
  const router = useRouter();
  const { signOut, isAuthenticated } = useAuth();

  useEffect(() => {
    let isMounted = true;
    
    const performLogout = async () => {
      try {
        await signOut();
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        if (isMounted) {
          router.push('/auth');
        }
      }
    };

    performLogout();
    
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        router.push('/auth');
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Saindo...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
      </div>
    </div>
  );
} 