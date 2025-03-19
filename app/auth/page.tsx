"use client"

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/resources/auth/auth-hook';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout';
import { LoginForm, RegisterForm } from './components/auth-forms';
import { ErrorAlert } from './components/auth-alerts';
import { Loader2 } from 'lucide-react';
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { signInWithEmail, signUpWithEmail, isLoading, isAuthenticated, error, clearError } = useAuth();

  // Redirecionar se autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/team-setup');
    }
  }, [isAuthenticated]);

  // Efeito para capturar parâmetros do convite
  useEffect(() => {
    const invite = searchParams.get('team');
    const email = searchParams.get('email');
    
    if (invite) {
      localStorage.setItem('pendingInviteTeamId', invite);
      if (email) {
        localStorage.setItem('pendingInviteEmail', email);
      }
    }
  }, [searchParams]);

  // Handlers
  const handleLoginSubmit = async (data: any) => {
    try {
      await signInWithEmail(data.email, data.password);
    } catch (error: any) {
      // O erro já está sendo gerenciado pelo AuthProvider
    }
  };

  const handleSignupSubmit = async (data: any) => {
    try {
      await signUpWithEmail(data.email, data.password);
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua conta foi criada. Você será redirecionado em instantes.",
      });
    } catch (error: any) {
      // O erro já está sendo gerenciado pelo AuthProvider
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Acesso ao Sistema</CardTitle>
            <CardDescription>
              Faça login ou crie uma conta para acessar a plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorAlert error={error} />
            
            <Tabs defaultValue="login" onValueChange={() => clearError()}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Registro</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm onSubmit={handleLoginSubmit} isLoading={isLoading} />
              </TabsContent>
              
              <TabsContent value="register">
                <RegisterForm onSubmit={handleSignupSubmit} isLoading={isLoading} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// Componente principal com Suspense
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
