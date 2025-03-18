"use client"

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/resources/auth/auth-hook';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginFormValues, RegisterFormValues, loginSchema, registerSchema } from '@/resources/auth/auth-model';
import { useTeam } from '@/resources/team/team-hook';
import { supabase } from '@/resources/auth/auth.service';
import { TeamService } from '@/resources/team/team.service';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertCircle, Info } from 'lucide-react';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isLoading, isAuthenticated, user, error, clearError } = useAuth();
  const { addTeamMember, loadUserTeams } = useTeam();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);
  const [processingInvite, setProcessingInvite] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<{ teamId: string; teamName: string } | null>(null);
  const [processedInvite, setProcessedInvite] = useState<boolean>(false);
  
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
    const inviteName = searchParams.get('invite_name');
    
    if (invite) {
      console.log(`Convite detectado na URL: teamId=${invite}, teamName=${inviteName || 'não informado'}`);
      setInviteTeamId(invite);
      
      // Se for um convite, mostrar a aba de cadastro por padrão
      setActiveTab('signup');
      
      // Preencher o email do formulário se estiver na URL
      const email = searchParams.get('email');
      if (email) {
        console.log(`Email detectado na URL: ${email}`);
        loginForm.setValue('email', email);
        registerForm.setValue('email', email);
      }
      
      // Armazenar dados do convite no localStorage para persistir durante autenticação OAuth
      localStorage.setItem('pendingInviteTeamId', invite);
      if (inviteName) {
        localStorage.setItem('pendingInviteTeamName', inviteName);
      }
      if (email) {
        localStorage.setItem('pendingInviteEmail', email);
      }
      
      // Limpar chaves antigas para garantir consistência
      localStorage.removeItem('pendingInvite');
      
      // Para compatibilidade com versões anteriores, também definir o pendingInvite
      localStorage.setItem('pendingInvite', invite);
    }
  }, [searchParams, loginForm, registerForm]);
  
  // Verificar se há convite pendente no localStorage
  useEffect(() => {
    if (!isLoading && isAuthenticated && !inviteTeamId) {
      const pendingInvite = localStorage.getItem('pendingInvite');
      if (pendingInvite) {
        setInviteTeamId(pendingInvite);
      }
    }
  }, [isLoading, isAuthenticated, inviteTeamId]);
  
  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (inviteTeamId) {
        processInvite();
      } else {
        const pendingInvite = localStorage.getItem('pendingInvite');
        if (pendingInvite) {
          setInviteTeamId(pendingInvite);
        } else {
          router.push('/team-setup');
        }
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
      
      // Usar o email do usuário ou o email do convite armazenado no localStorage
      const inviteEmail = localStorage.getItem('pendingInviteEmail');
      const userEmail = user.email || inviteEmail;
      
      if (!userEmail) {
        throw new Error('Email não disponível');
      }

      console.log(`Processando convite: teamId=${inviteTeamId}, userId=${user.id}, email=${userEmail}`);

      // Processar o convite usando o TeamService
      const memberId = await TeamService.processInvite(inviteTeamId, user.id, userEmail);
      
      if (memberId) {
        console.log('Convite processado com sucesso:', memberId);
        
        // Armazenar IDs importantes
        localStorage.setItem('teamId', inviteTeamId);
        localStorage.setItem('teamMemberId', memberId);
        
        // Sincronizar outras associações de equipe
        await TeamService.syncUserTeamMemberships(user.id, userEmail);
        
        // Atualizar o cache de membros
        await loadUserTeams(user.id);
        
        toast({
          title: "Convite aceito com sucesso!",
          description: "Você agora é membro da equipe.",
        });
      }
      
      // Limpar os dados do convite do localStorage
      localStorage.removeItem('pendingInvite');
      localStorage.removeItem('pendingInviteEmail');
      localStorage.removeItem('pendingInviteTeamId');
      localStorage.removeItem('pendingInviteTeamName');
      
      // Redirecionar para a página de configuração da equipe
      router.push('/team-setup');
    } catch (error: any) {
      console.error('Erro ao processar convite:', error);
      toast({
        title: "Erro ao processar convite",
        description: error.message || "Ocorreu um erro ao processar o convite.",
        variant: "destructive"
      });
      
      // Mesmo com erro, tentar redirecionar para a página principal
      router.push('/team-setup');
    } finally {
      setProcessingInvite(false);
    }
  }, [inviteTeamId, processingInvite, loadUserTeams, toast, router]);
  
  // Função auxiliar para adicionar usuário à equipe
  const adicionarUsuarioEquipe = async (user: any, teamId: string) => {
    try {
      // Primeiro, verificar se a equipe existe
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
      
      if (teamError) {
        throw new Error(`Equipe não encontrada: ${teamError.message}`);
      }
      
      // Adicionar o usuário à equipe
      await addTeamMember(
        teamId,
        user.id,
        user.email || '',
        'member',
        'invited'
      );
      
      toast({
        title: "Convite aceito com sucesso!",
        description: `Você agora é membro da equipe ${team.name}.`,
      });
    } catch (error: any) {
      console.error('Erro ao adicionar membro à equipe:', error);
      throw error;
    }
  };
  
  // Manipulador de envio do formulário de login
  const handleLoginSubmit = useCallback(async (data: LoginFormValues) => {
    setLocalError(null);
    setLocalLoading(true);
    
    try {
      await signInWithEmail(data.email, data.password);
      
      // Se houver um convite, o redirecionamento será tratado pelo useEffect
      if (!inviteTeamId) {
        router.push('/team-setup');
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      setLocalError(error.message || "Ocorreu um erro ao fazer login. Verifique suas credenciais e tente novamente.");
    } finally {
      setLocalLoading(false);
    }
  }, [inviteTeamId]);
  
  // Manipulador de envio do formulário de cadastro
  const handleSignupSubmit = useCallback(async (data: RegisterFormValues) => {
    setLocalError(null);
    setLocalLoading(true);
    
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
      setLocalError(error.message || "Ocorreu um erro ao criar sua conta. Tente novamente.");
    } finally {
      setLocalLoading(false);
    }
  }, [inviteTeamId]);
  
  // Manipulador de mudança de aba
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setLocalError(null);
    
    // Limpar formulários ao mudar de aba
    if (value === "login") {
      registerForm.reset({
        email: searchParams.get("email") || "",
        password: "",
        confirmPassword: "",
      });
    } else {
      loginForm.reset({
        email: searchParams.get("email") || "",
        password: "",
      });
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
  
  // Carregar detalhes do convite se houver
  useEffect(() => {
    const loadInviteDetails = async () => {
      const inviteCode = searchParams.get("invite");
      
      if (inviteCode) {
        try {
          console.log(`Carregando detalhes do convite: ${inviteCode}`);
          const team = await TeamService.getTeamByInvite(inviteCode);
          
          if (team) {
            console.log(`Equipe encontrada: ${team.name}`);
            setInviteDetails({
              teamId: team.id,
              teamName: team.name,
            });
            
            // Armazenar informações do convite no localStorage para uso posterior
            localStorage.setItem("pendingInviteTeamId", team.id);
            localStorage.setItem("pendingInviteTeamName", team.name);
          } else {
            console.log('Convite inválido ou equipe não encontrada');
            toast({
              title: "Convite inválido",
              description: "O convite não é válido ou expirou.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Erro ao carregar detalhes do convite:", error);
        }
      } else {
        // Verificar se há um convite pendente no localStorage
        const pendingTeamId = localStorage.getItem("pendingInviteTeamId");
        const pendingTeamName = localStorage.getItem("pendingInviteTeamName");
        
        if (pendingTeamId && pendingTeamName) {
          setInviteDetails({
            teamId: pendingTeamId,
            teamName: pendingTeamName,
          });
        }
      }
    };
    
    loadInviteDetails();
  }, [searchParams]);
  
  // Efeito específico para lidar com autenticação Google concluída
  useEffect(() => {
    const processGoogleAuth = async () => {
      // Verificar se o usuário acabou de autenticar e não há processamento em andamento
      if (isAuthenticated && user && !processedInvite && !localLoading && !isLoading) {
        // Verificar se há convite nos parâmetros ou nos cookies
        const params = new URLSearchParams(window.location.search);
        const inviteFromUrl = params.get('invite');
        const inviteNameFromUrl = params.get('invite_name');
        
        const storedInviteId = localStorage.getItem('pendingInviteTeamId');
        const storedInviteName = localStorage.getItem('pendingInviteTeamName');
        
        // Usar parâmetros da URL ou do localStorage
        const teamId = inviteFromUrl || storedInviteId;
        const teamName = inviteNameFromUrl || storedInviteName;
        
        if (!teamId) {
          console.log('Nenhum convite pendente encontrado após autenticação Google');
          router.push('/team-setup');
          return;
        }
        
        console.log(`Convite encontrado após autenticação Google: ${teamId}`);
        
        try {
          setLocalLoading(true);
          
          // Processar o convite
          const memberId = await TeamService.processInvite(
            teamId,
            user.id,
            user.email || ''
          );
          
          if (memberId) {
            // Armazenar IDs importantes
            localStorage.setItem('teamId', teamId);
            localStorage.setItem('teamMemberId', memberId);
            
            // Sincronizar outras associações de equipe
            await TeamService.syncUserTeamMemberships(user.id, user.email || '');
            
            // Recarregar equipes do usuário
            await loadUserTeams(user.id);
            
            // Limpar dados pendentes
            localStorage.removeItem('pendingInviteTeamId');
            localStorage.removeItem('pendingInviteTeamName');
            
            // Marcar convite como processado
            setProcessedInvite(true);
            
            toast({
              title: "Bem-vindo à equipe!",
              description: `Você agora faz parte da equipe ${teamName || ''}`
            });
            
            // Redirecionar após processamento
            setTimeout(() => {
              router.push('/team-setup');
            }, 500);
          }
        } catch (error: any) {
          console.error('Erro ao processar convite após autenticação Google:', error);
          toast({
            title: "Erro ao processar convite",
            description: error.message || "Ocorreu um erro ao processar seu convite",
            variant: "destructive"
          });
          
          // Mesmo com erro, tentar redirecionar
          router.push('/team-setup');
        } finally {
          setLocalLoading(false);
        }
      }
    };
    
    processGoogleAuth();
  }, [isAuthenticated, user, processedInvite]);
  
  // Limpar erros ao mudar de aba
  useEffect(() => {
    if (error) {
      clearError();
    }
    setLocalError(null);
  }, [activeTab, error, clearError]);
  
  // Se estiver carregando, mostrar spinner
  if ((isLoading || localLoading) && !localError && !error) {
    return (
      <Layout>
        <div className="container flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Processando sua solicitação...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Se usuário está autenticado mas sem convite, redirecionar para setup
  if (isAuthenticated && !inviteDetails && !processedInvite && !isLoading && !localLoading) {
    router.push("/team-setup");
    return (
      <Layout>
        <div className="container flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Redirecionando...</p>
          </div>
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
              {inviteDetails 
                ? `Você foi convidado para a equipe ${inviteDetails.teamName}. Faça login ou registre-se para participar.` 
                : "Faça login ou crie uma conta para acessar a plataforma."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(localError || error) && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{localError || error}</AlertDescription>
              </Alert>
            )}
            
            {inviteDetails && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Convite recebido</AlertTitle>
                <AlertDescription>
                  Após fazer login ou se registrar, você será automaticamente adicionado à equipe.
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Registro</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading || localLoading}>
                      {(isLoading || localLoading) ? "Processando..." : "Entrar"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleSignupSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading || localLoading}>
                      {(isLoading || localLoading) ? "Processando..." : "Registrar"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          {/* <CardFooter className="flex flex-col">
            <div className="relative w-full mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">Ou continue com</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={signInWithGoogle}
              disabled={isLoading || localLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Google
            </Button>
          </CardFooter> */}
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
