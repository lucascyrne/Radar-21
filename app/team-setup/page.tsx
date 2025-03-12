"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/resources/auth/auth-hook';
import { useTeam } from '@/resources/team/team-hook';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTeamFormValues, createTeamSchema } from '@/resources/team/team-model';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress"
import { Layout } from "@/components/layout"
import { CopyIcon, CheckIcon, SendIcon, ArrowRightIcon, PlusCircleIcon, UserIcon } from "lucide-react"
import { FormLabel, FormDescription } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/resources/auth/auth.service';

// Mapeamento de status para exibição
const STATUS_MAP = {
  'leader': { display: 'Líder', class: 'bg-blue-100 text-blue-800' },
  'invited': { display: 'Convidado', class: 'bg-gray-100 text-gray-800' },
  'enviado': { display: 'Convidado', class: 'bg-gray-100 text-gray-800' },
  'registered': { display: 'Registrado', class: 'bg-yellow-100 text-yellow-800' },
  'cadastrado': { display: 'Registrado', class: 'bg-yellow-100 text-yellow-800' },
  'completed': { display: 'Respondido', class: 'bg-green-100 text-green-800' },
  'respondido': { display: 'Respondido', class: 'bg-green-100 text-green-800' }
};

export default function TeamSetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { 
    teams, 
    selectedTeam, 
    teamMembers, 
    isLoading: teamLoading, 
    error: teamError,
    loadUserTeams,
    loadTeamMembers,
    createTeam,
    addTeamMember,
    selectTeam,
    generateInviteMessage,
    resetTeamsLoaded,
    resetMembersLoaded
  } = useTeam();
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("my-teams");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [messageCopied, setMessageCopied] = useState(false);
  
  // Mapa para rastrear equipes em que o usuário já completou o questionário
  const [completedTeams, setCompletedTeams] = useState<Record<string, boolean>>({});
  
  // Refs para controlar se as requisições já foram feitas
  const teamsLoadedRef = useRef(false);
  const membersLoadedRef = useRef<Record<string, boolean>>({});

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [authLoading, isAuthenticated, router]);

  // Carregar equipes do usuário apenas uma vez
  useEffect(() => {
    if (user && isAuthenticated && !teamsLoadedRef.current && teams.length === 0) {
      loadUserTeams(user.id);
      teamsLoadedRef.current = true;
    }
  }, [user, isAuthenticated, loadUserTeams, teams.length]);

  // Carregar membros da equipe selecionada apenas uma vez por equipe
  useEffect(() => {
    const loadMembers = async () => {
      if (selectedTeam && !membersLoadedRef.current[selectedTeam.id]) {
        await loadTeamMembers(selectedTeam.id);
        membersLoadedRef.current[selectedTeam.id] = true;
      }
    };
    
    if (selectedTeam) {
      loadMembers();
    }
  }, [selectedTeam, loadTeamMembers]);

  // Atualizar mensagem de convite quando a equipe selecionada mudar
  useEffect(() => {
    if (selectedTeam && user) {
      const message = generateInviteMessage(selectedTeam.name, user.email || '');
      setInviteMessage(message);
    }
  }, [selectedTeam, user, generateInviteMessage]);
  
  // Verificar se o usuário já completou o questionário para cada equipe
  useEffect(() => {
    if (teamMembers.length > 0 && user && selectedTeam) {
      const userMembership = teamMembers.find(m => m.email === user.email);
      
      if (userMembership) {
        // Verificar se o status indica que o questionário foi respondido
        const completedStatuses = ['respondido', 'completed'];
        const isCompleted = userMembership.status && completedStatuses.includes(userMembership.status);
        
        if (isCompleted) {
          // Atualizar o mapa de equipes completadas
          setCompletedTeams(prev => ({
            ...prev,
            [selectedTeam.id]: true
          }));
          
          // Também salvar no localStorage para persistência
          localStorage.setItem(`surveyCompleted_${selectedTeam.id}`, "true");
        }
      }
    }
  }, [selectedTeam, user, teamMembers]);

  // Verificar dados salvos no localStorage
  useEffect(() => {
    // Verificar para todas as equipes se o questionário foi respondido
    teams.forEach(team => {
      // Verificar no formato novo
      const teamCompleted = localStorage.getItem(`surveyCompleted_${team.id}`) === "true";
      
      // Verificar também no formato antigo
      const oldFormatCompleted = localStorage.getItem("surveyCompleted") === "true" && 
                                localStorage.getItem("teamId") === team.id;
      
      if (teamCompleted || oldFormatCompleted) {
        setCompletedTeams(prev => ({
          ...prev,
          [team.id]: true
        }));
        
        // Migrar para o novo formato se necessário
        if (oldFormatCompleted && !teamCompleted) {
          localStorage.setItem(`surveyCompleted_${team.id}`, "true");
        }
      }
    });
  }, [teams]);

  // Configuração do formulário de criação de equipe
  const createTeamForm = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      role: 'leader',
      team_size: 5,
    },
  });

  // Manipuladores de envio de formulário
  const handleCreateTeamSubmit = useCallback(async (data: CreateTeamFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Criar a equipe usando o provider
      await createTeam(data, user.id, user.email || '');
      
      // Resetar o ref para permitir carregar equipes novamente
      teamsLoadedRef.current = false;
      resetTeamsLoaded();
      
      // Mudar para a aba de minhas equipes
      setActiveTab("my-teams");
      
      toast({
        title: "Equipe criada com sucesso!",
        description: "Agora você pode convidar membros para sua equipe.",
      });
      
    } catch (error: any) {
      console.error('Erro ao criar equipe:', error);
      toast({
        title: "Erro ao criar equipe",
        description: error.message || 'Erro ao criar equipe. Tente novamente.',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, createTeam, toast, resetTeamsLoaded]);

  // Verificar se o usuário já existe no Supabase
  const checkUserExists = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar usuário:', error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      return null;
    }
  }, []);

  // Enviar convite por email
  const sendInviteEmail = useCallback(async () => {
    if (!selectedTeam || !inviteEmail || !inviteMessage) {
      toast({
        title: "Erro ao enviar convite",
        description: "Por favor, preencha o email do convidado e a mensagem de convite.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSendingInvite(true);
    
    try {
      // Verificar se o membro já existe na equipe
      const existingMember = teamMembers.find(member => member.email === inviteEmail);
      
      if (existingMember) {
        toast({
          title: "Membro já existe",
          description: "Este email já foi convidado para a equipe.",
          variant: "destructive"
        });
        setIsSendingInvite(false);
        return;
      }
      
      // Verificar se o usuário já existe no sistema
      const userId = await checkUserExists(inviteEmail);
      
      // Gerar URL de convite
      const inviteUrl = `${window.location.origin}/auth?invite=${selectedTeam.id}`;
      
      // Enviar convite via API
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          inviteUrl,
          message: inviteMessage,
          teamId: selectedTeam.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Resposta de erro:', errorData);
        throw new Error(errorData.error || 'Erro ao enviar convite');
      }
      
      // Adicionar membro à equipe com status 'invited'
      await addTeamMember(
        selectedTeam.id,
        userId, // Usar o ID do usuário se existir
        inviteEmail,
        'member',
        'invited'
      );
      
      // Resetar o ref para permitir carregar membros novamente
      membersLoadedRef.current[selectedTeam.id] = false;
      resetMembersLoaded(selectedTeam.id);
      
      // Recarregar membros da equipe para mostrar o novo membro
      await loadTeamMembers(selectedTeam.id);
      
      // Limpar campo de email
      setInviteEmail('');
      
      toast({
        title: "Convite enviado com sucesso!",
        description: "O membro foi adicionado à equipe e recebeu um email de convite.",
      });
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Ocorreu um erro ao enviar o convite. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSendingInvite(false);
    }
  }, [selectedTeam, inviteEmail, inviteMessage, teamMembers, addTeamMember, loadTeamMembers, checkUserExists, toast, resetMembersLoaded]);

  // Copiar mensagem de convite para a área de transferência
  const copyInviteMessage = useCallback(() => {
    navigator.clipboard.writeText(inviteMessage);
    setMessageCopied(true);
    setTimeout(() => setMessageCopied(false), 2000);
  }, [inviteMessage]);

  // Mudar equipe selecionada
  const handleTeamChange = useCallback((teamId: string) => {
    // Primeiro atualizar o estado de completedTeams antes de mudar a equipe selecionada
    const teamCompleted = localStorage.getItem(`surveyCompleted_${teamId}`) === "true";
    
    // Verificar também o formato antigo para compatibilidade
    const oldFormatCompleted = localStorage.getItem("surveyCompleted") === "true" && 
                              localStorage.getItem("teamId") === teamId;
    
    if (teamCompleted || oldFormatCompleted) {
      setCompletedTeams(prev => ({
        ...prev,
        [teamId]: true
      }));
    }
    
    // Depois selecionar a equipe
    selectTeam(teamId);
  }, [selectTeam]);

  // Limpar erros ao mudar de aba
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    
    if (value === "create-team") {
    createTeamForm.reset();
    }
  }, [createTeamForm]);

  // Continuar para a próxima etapa
  const handleContinue = useCallback(() => {
    // Salvar informações da equipe no localStorage para uso nas próximas páginas
    if (selectedTeam) {
      localStorage.setItem("teamName", selectedTeam.name);
      localStorage.setItem("teamId", selectedTeam.id);
      
      // Se o usuário já completou o questionário para esta equipe, ir para os resultados
      if (completedTeams[selectedTeam.id]) {
        router.push('/results');
      } else {
        // Caso contrário, ir para a próxima etapa (perfil)
        router.push('/profile');
      }
    }
  }, [selectedTeam, completedTeams, router]);

  // Responder novamente ao questionário
  const handleResetSurvey = useCallback(() => {
    if (selectedTeam) {
      localStorage.removeItem("userProfile");
      localStorage.removeItem("surveyResponses");
      localStorage.removeItem("openQuestionsResponses");
      localStorage.removeItem("radarData");
      localStorage.removeItem("surveyCompleted");
      localStorage.removeItem(`surveyCompleted_${selectedTeam.id}`);
      
      // Atualizar o estado para refletir que o usuário não completou o questionário
      setCompletedTeams(prev => ({
        ...prev,
        [selectedTeam.id]: false
      }));
    }
  }, [selectedTeam]);

  // Efeito para verificar o status de conclusão quando a equipe selecionada muda
  useEffect(() => {
    if (selectedTeam) {
      // Verificar no formato novo
      const teamCompleted = localStorage.getItem(`surveyCompleted_${selectedTeam.id}`) === "true";
      
      // Verificar também no formato antigo
      const oldFormatCompleted = localStorage.getItem("surveyCompleted") === "true" && 
                                localStorage.getItem("teamId") === selectedTeam.id;
      
      if (teamCompleted || oldFormatCompleted) {
        setCompletedTeams(prev => ({
          ...prev,
          [selectedTeam.id]: true
        }));
      }
    }
  }, [selectedTeam]);

  if (authLoading || teamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Verificar se o usuário já completou o questionário para a equipe selecionada
  const hasCompletedCurrentTeam = selectedTeam ? completedTeams[selectedTeam.id] : false;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span className="font-bold">Minha Equipe</span>
            <span className="text-muted-foreground">Meu Perfil</span>
            <span className="text-muted-foreground">Radar das Competências de Liderança 4.0</span>
            <span className="text-muted-foreground">Resultados</span>
          </div>
          <Progress value={25} className="h-2" />
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">Minha Equipe</h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-teams">Minhas Equipes</TabsTrigger>
            <TabsTrigger value="create-team">Criar Nova Equipe</TabsTrigger>
          </TabsList>
          
          {/* Exibir mensagens de erro */}
          {teamError && (
            <Alert variant="destructive" className="mb-4 mt-4">
              <AlertDescription>{teamError}</AlertDescription>
            </Alert>
          )}
          
          {/* Aba de Minhas Equipes */}
          <TabsContent value="my-teams">
            {teams.length === 0 ? (
          <Card>
                <CardHeader>
                  <CardTitle>Nenhuma equipe encontrada</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Você ainda não faz parte de nenhuma equipe. Crie uma nova equipe ou aguarde um convite.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setActiveTab("create-team")} 
                    className="w-full flex items-center justify-center"
                  >
                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                    Criar Nova Equipe
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <>
                {/* Lista de equipes do usuário */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Minhas Equipes</CardTitle>
                    <CardDescription>
                      Selecione uma equipe para trabalhar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {teams.map((team) => (
                        <div 
                          key={team.id} 
                          className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${
                            selectedTeam && selectedTeam.id === team.id 
                              ? 'bg-primary/10 border border-primary/30' 
                              : 'hover:bg-secondary'
                          }`}
                          onClick={() => handleTeamChange(team.id)}
                        >
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {team.owner_email === user?.email ? 'Você é o líder' : 'Você é membro'}
                            </div>
                            {completedTeams[team.id] && (
                              <div className="text-xs text-green-600 mt-1">
                                Questionário respondido
                              </div>
                            )}
                          </div>
                          {selectedTeam && selectedTeam.id === team.id && (
                            <CheckIcon className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Exibir equipe atual */}
                {selectedTeam && (
                  <>
                    {/* Mostrar card "Você já completou o questionário" apenas para a equipe selecionada */}
                    {hasCompletedCurrentTeam && (
                      <Card className="mb-6">
            <CardHeader>
              <CardTitle>Você já completou o questionário</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                            Você já completou o questionário para a equipe "{selectedTeam.name}".
              </p>
              <p>O que você gostaria de fazer?</p>
            </CardContent>
            <CardFooter className="flex justify-between">
                          <Button variant="outline" onClick={handleResetSurvey}>
                Responder novamente
              </Button>
              <Button onClick={() => router.push("/results")}>
                Ver meus resultados
              </Button>
            </CardFooter>
          </Card>
                    )}

                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Equipe Atual</CardTitle>
                        <CardDescription>
                          Você está trabalhando com a equipe {selectedTeam.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4">
                          <div>
                            <Label>Nome da Equipe</Label>
                            <div className="font-medium mt-1">{selectedTeam.name}</div>
                          </div>
                          <div>
                            <Label>Criada por</Label>
                            <div className="font-medium mt-1">{selectedTeam.owner_email || user?.email}</div>
                          </div>
                          <div>
                            <Label>Tamanho da Equipe</Label>
                            <div className="font-medium mt-1">{selectedTeam.team_size} membros</div>
                          </div>
                          <div>
                            <Label>Data de Criação</Label>
                            <div className="font-medium mt-1">
                              {selectedTeam.created_at 
                                ? new Date(selectedTeam.created_at).toLocaleDateString('pt-BR') 
                                : '-'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Convidar membros e status da equipe */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Convidar Equipe</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <FormLabel>Mensagem de convite</FormLabel>
                          <FormDescription>
                            Customize e envie a mensagem abaixo para sua equipe nos seus canais.
                          </FormDescription>
                          <div className="mt-2 relative">
                            <Textarea
                              value={inviteMessage}
                              onChange={(e) => setInviteMessage(e.target.value)}
                              className="min-h-[100px]"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2"
                              onClick={copyInviteMessage}
                            >
                              {messageCopied ? (
                                <CheckIcon className="h-4 w-4 text-green-500" />
                              ) : (
                                <CopyIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Email do convidado"
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                            />
                            <Button 
                              onClick={sendInviteEmail} 
                              disabled={isSendingInvite || !inviteEmail}
                              className="flex items-center"
                            >
                              <SendIcon className="mr-2 h-4 w-4" />
                              {isSendingInvite ? 'Enviando...' : 'Enviar Convite'}
                            </Button>
                          </div>
                          
                          <h3 className="text-lg font-medium mb-2">Status da Equipe</h3>
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {teamMembers.map((member, index) => {
                                  // Determinar o status a ser exibido
                                  let statusInfo = { display: 'Desconhecido', class: 'bg-gray-100 text-gray-800' };
                                  
                                  // Se for o líder da equipe
                                  if (member.role === 'leader') {
                                    statusInfo = STATUS_MAP['leader'];
                                  } 
                                  // Para outros status, usar o mapeamento
                                  else if (member.status && STATUS_MAP[member.status]) {
                                    statusInfo = STATUS_MAP[member.status];
                                  }
                                  
                                  return (
                                    <TableRow key={index}>
                                      <TableCell className="flex items-center">
                                        <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                        {member.email}
                                        {member.email === user?.email && (
                                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                            Você
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.class}`}>
                                          {statusInfo.display}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          onClick={handleContinue} 
                          className="w-full flex items-center justify-center"
                        >
                          {hasCompletedCurrentTeam ? 'Ver Resultados' : 'Continuar para Perfil'}
                          <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </>
                )}
              </>
            )}
          </TabsContent>
          
          {/* Formulário para Criar Equipe */}
          <TabsContent value="create-team">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados Sobre a equipe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormProvider {...createTeamForm}>
                      <form onSubmit={createTeamForm.handleSubmit(handleCreateTeamSubmit)} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome da equipe</Label>
                          <Input
                            id="name"
                            placeholder="Ex: Equipe de Desenvolvimento"
                            {...createTeamForm.register('name')}
                          />
                          {createTeamForm.formState.errors.name && (
                            <p className="text-sm text-red-500">{createTeamForm.formState.errors.name.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Meu email</Label>
                          <Input
                            value={user?.email || ''}
                            disabled
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Meu papel é de</Label>
                          <RadioGroup 
                            defaultValue={createTeamForm.getValues('role')}
                            onValueChange={(value) => createTeamForm.setValue('role', value as 'leader' | 'member')}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="leader" id="leader" />
                              <Label htmlFor="leader">Líder da equipe</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="member" id="member" />
                              <Label htmlFor="member">Colaborador na equipe</Label>
                            </div>
                          </RadioGroup>
                          {createTeamForm.formState.errors.role && (
                            <p className="text-sm text-red-500">{createTeamForm.formState.errors.role.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="team_size">Número de pessoas na equipe</Label>
                          <Input
                            id="team_size"
                            type="number"
                            min="1"
                            {...createTeamForm.register('team_size', { valueAsNumber: true })}
                          />
                          {createTeamForm.formState.errors.team_size && (
                            <p className="text-sm text-red-500">{createTeamForm.formState.errors.team_size.message}</p>
                          )}
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? 'Criando...' : 'Criar Equipe'}
                        </Button>
                      </form>
                    </FormProvider>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
      </div>
    </Layout>
  );
}

