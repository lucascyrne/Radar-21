"use client"

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/resources/auth/auth-hook';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginFormValues, RegisterFormValues, loginSchema, registerSchema } from '@/resources/auth/auth-model';
import { useTeam } from '@/resources/team/team-hook';
import { supabase } from '@/resources/auth/auth.service';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isLoading, isAuthenticated, user, error, clearError } = useAuth();
  const { addTeamMember } = useTeam();

  const [activeTab, setActiveTab] = useState<string>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);
  const [processingInvite, setProcessingInvite] = useState(false);
  
  // Configurar formulário de login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  // Configurar formulário de cadastro
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  // Verificar se há um convite na URL
  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite) {
      setInviteTeamId(invite);
      // Se for um convite, mostrar a aba de cadastro por padrão
      setActiveTab('signup');
      
      // Preencher o email do formulário se estiver na URL
      const email = searchParams.get('email');
      if (email) {
        loginForm.setValue('email', email);
        registerForm.setValue('email', email);
      }
    }
  }, [searchParams, loginForm, registerForm]);
  
  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (inviteTeamId) {
        processInvite();
      } else {
        router.push('/team-setup');
      }
    }
  }, [isLoading, isAuthenticated, router, inviteTeamId]);
  
  // Processar convite após autenticação
  const processInvite = useCallback(async () => {
    if (!inviteTeamId || processingInvite) return;
    
    setProcessingInvite(true);
    
    try {
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Verificar se o usuário já é membro da equipe
      const { data: existingMember, error: memberError } = await supabase
        .from('team_members')
        .select('id, status')
        .eq('team_id', inviteTeamId)
        .eq('email', user.email)
        .maybeSingle();
      
      if (memberError && memberError.code !== 'PGRST116') {
        console.error('Erro ao verificar membro:', memberError);
      }
      
      if (existingMember) {
        // Se o usuário já é membro, apenas atualizar o status e o user_id
        const { error: updateError } = await supabase
          .from('team_members')
          .update({ 
            user_id: user.id,
            status: 'registered'
          })
          .eq('id', existingMember.id);
        
        if (updateError) {
          console.error('Erro ao atualizar membro:', updateError);
        }
      } else {
        // Se o usuário não é membro, adicionar à equipe
        try {
          // Primeiro, verificar se a equipe existe
          const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('id, name')
            .eq('id', inviteTeamId)
            .single();
          
          if (teamError) {
            throw new Error(`Equipe não encontrada: ${teamError.message}`);
          }
          
          // Adicionar o usuário à equipe
          await addTeamMember(
            inviteTeamId,
            user.id,
            user.email || '',
            'member',
            'registered'
          );
          
          toast({
            title: "Convite aceito com sucesso!",
            description: `Você agora é membro da equipe ${team.name}.`,
          });
        } catch (error: any) {
          console.error('Erro ao adicionar membro à equipe:', error);
          // Não mostrar toast de erro para não confundir o usuário
        }
      }
      
      // Redirecionar para a página de configuração da equipe
      router.push('/team-setup');
    } catch (error: any) {
      console.error('Erro ao processar convite:', error);
      // Não mostrar toast de erro para não confundir o usuário
    } finally {
      setProcessingInvite(false);
    }
  }, [inviteTeamId, processingInvite, router, addTeamMember, toast]);
  
  // Manipulador de envio do formulário de login
  const handleLoginSubmit = useCallback(async (data: LoginFormValues) => {
    setIsSubmitting(true);
    
    try {
      await signInWithEmail(data.email, data.password);
      
      // Se houver um convite, o redirecionamento será tratado pelo useEffect
      if (!inviteTeamId) {
        router.push('/team-setup');
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Ocorreu um erro ao fazer login. Verifique suas credenciais e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [signInWithEmail, router, inviteTeamId, toast]);
  
  // Manipulador de envio do formulário de cadastro
  const handleSignupSubmit = useCallback(async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    
    try {
      await signUpWithEmail(data.email, data.password);
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua conta foi criada. Você será redirecionado em instantes.",
      });
      
      // Se houver um convite, o redirecionamento será tratado pelo useEffect
      if (!inviteTeamId) {
        router.push('/team-setup');
      }
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro ao criar sua conta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [signUpWithEmail, router, inviteTeamId, toast]);
  
  // Manipulador de mudança de aba
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    
    // Limpar formulários ao mudar de aba
    if (value === "login") {
      registerForm.reset();
    } else {
      loginForm.reset();
    }
    
    // Preencher o email se houver um convite
    const email = searchParams.get('email');
    if (email) {
      if (value === "login") {
        loginForm.setValue('email', email);
      } else {
        registerForm.setValue('email', email);
      }
    }
  }, [loginForm, registerForm, searchParams]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Layout>
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Radar21</CardTitle>
            <CardDescription>
              {inviteTeamId 
                ? "Você recebeu um convite para participar de uma equipe. Entre ou crie uma conta para continuar."
                : "Entre com sua conta ou crie uma nova para acessar a plataforma."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastro</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      {...loginForm.register('email')}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      {...loginForm.register('password')}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Entrando..." : "Entrar"}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Ou continue com
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => signInWithGoogle()}
                    disabled={isSubmitting}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={registerForm.handleSubmit(handleSignupSubmit)} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      {...registerForm.register('email')}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      {...registerForm.register('password')}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      {...registerForm.register('confirmPassword')}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Criando conta..." : "Criar conta"}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Ou continue com
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => signInWithGoogle()}
                    disabled={isSubmitting}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-center w-full text-muted-foreground">
              Ao entrar, você concorda com nossos termos de serviço e política de privacidade.
            </p>
          </CardFooter>
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
