"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/resources/auth/auth-hook';
import { useTeam } from '@/resources/team/team-hook';
import { CreateTeamFormValues, Team } from '@/resources/team/team-model';
import { SurveyService } from '@/resources/survey/survey.service';
import { useToast } from '@/hooks/use-toast';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Layout } from "@/components/layout"
import { PlusCircleIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/resources/auth/auth.service';
import { Skeleton } from '@/components/ui/skeleton';

// Componentes personalizados
import { SetupProgress } from '@/components/team/setup-progress';
import { CreateTeamForm } from '@/components/team/create-team-form';
import { TeamList } from '@/components/team/team-list';
import { TeamDetails } from '@/components/team/team-details';
import InviteUserForm from '@/components/team/invite-user-form';

// Componente de Skeleton para equipes
const TeamSkeleton = () => (
  <Card className="mb-4">
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </CardContent>
  </Card>
);

export default function TeamSetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { teams, selectedTeam, teamMembers, createTeam, loadTeams, loadTeamMembers, generateInviteMessage, resetTeamsLoaded } = useTeam();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("my-teams");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [surveyStatus, setSurveyStatus] = useState<'loading' | 'not_member' | 'error' | 'success'>('loading');
  
  // Efeito para redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [authLoading, user]);

  // Efeito para carregar equipes do usuário uma única vez
  useEffect(() => {
    if (user?.id) {
      loadTeams(user.id);
    }
  }, [user?.id]);

  // Efeito para atualizar mensagem de convite
  useEffect(() => {
    if (selectedTeam && user?.email) {
      const message = generateInviteMessage(selectedTeam.name, user.email);
      setInviteMessage(message);
    }
  }, [selectedTeam?.id, user?.email]);

  // Efeito para verificar status da pesquisa
  useEffect(() => {
    const checkSurveyStatus = async () => {
      if (!selectedTeam?.id || !user?.email) {
        setSurveyStatus('loading');
        return;
      }
      
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', selectedTeam.id)
          .eq('email', user.email)
          .single();

        if (memberError) {
          if (memberError.code === 'PGRST116') {
            // Usuário não é membro da equipe - comportamento esperado
            setSurveyStatus('not_member');
            return;
          }
          // Erro real do sistema
          console.error('Erro ao verificar membro da equipe:', memberError);
          setSurveyStatus('error');
          return;
        }

        // Verificar se o usuário já respondeu a pesquisa
        const hasAnswered = memberData.status === 'answered';
        
        setSurveyStatus(hasAnswered ? 'success' : 'not_member');

        // Se o usuário está autenticado mas ainda não está registrado, atualizar para "invited"
        if (memberData.status === 'invited') {
          await supabase
            .from('team_members')
            .update({ status: 'invited' })
            .eq('id', memberData.id);
        }
      } catch (error) {
        console.error('Erro ao verificar status da pesquisa:', error);
        setSurveyStatus('error');
      }
    };

    checkSurveyStatus();
  }, [selectedTeam?.id, user?.email]);

  // Handlers
  const handleCreateTeamSubmit = useCallback(async (data: CreateTeamFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await createTeam(data, user.id, user.email || '');
      resetTeamsLoaded();
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
  }, [user]);

  const handleSendInvite = useCallback(async (email: string) => {
    setIsSendingInvite(true);
    try {
      if (!selectedTeam || !user?.email) return;
      
      const inviteUrl = `${window.location.origin}/auth?invite=${selectedTeam.id}&email=${encodeURIComponent(email)}`;
      
      await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          inviteUrl,
          message: inviteMessage,
          teamId: selectedTeam.id,
          teamName: selectedTeam.name,
          invitedBy: user.email
        }),
      });

      // Forçar recarregamento dos membros
      loadTeamMembers(selectedTeam.id);
      
      toast({
        title: "Convite enviado",
        description: "O membro foi adicionado à equipe e recebeu um email de convite.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Ocorreu um erro ao enviar o convite.",
        variant: "destructive",
      });
    } finally {
      setIsSendingInvite(false);
    }
  }, [selectedTeam, user?.email, inviteMessage, toast, loadTeamMembers]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const handleNext = useCallback(async () => {
    if (!selectedTeam?.id || !user?.id) return;

    const surveyComplete = await SurveyService.checkSurveyCompletion(user.id, selectedTeam.id);
    
    if (surveyComplete) {
      router.push('/open-questions');
    } else {
      router.push('/survey');
    }
  }, [selectedTeam?.id, user?.id, router]);

  const handleTeamSelect = useCallback(async (teamId: string) => {
    if (!user?.id) return;
    
    await loadTeams(user.id);
    const surveyComplete = await SurveyService.checkSurveyCompletion(user.id, teamId);
    
    if (surveyComplete) {
      router.push('/open-questions');
    } else {
      router.push('/survey');
    }
  }, [user?.id, router, loadTeams]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-3xl">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Configuração da Equipe</h1>
          <p className="text-muted-foreground">
            Crie uma nova equipe ou participe de uma equipe existente para começar a avaliação.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex justify-center w-full">
            <TabsList>
              <TabsTrigger value="my-teams">Minhas Equipes</TabsTrigger>
              <TabsTrigger value="create-team">Criar Nova Equipe</TabsTrigger>
            </TabsList>
          </div>
          
          {surveyStatus === 'error' && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>Ocorreu um erro ao verificar o status da pesquisa. Por favor, tente novamente mais tarde.</AlertDescription>
            </Alert>
          )}
          
          <TabsContent value="my-teams" className="space-y-6">
            {surveyStatus === 'loading' ? (
              <div className="space-y-4">
                <TeamSkeleton />
                <TeamSkeleton />
              </div>
            ) : teams.length === 0 ? (
              <Card className="bg-card">
                <CardHeader className="space-y-2">
                  <CardTitle>Nenhuma equipe encontrada</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Você ainda não faz parte de nenhuma equipe. Crie uma nova equipe ou aguarde um convite.
                  </p>
                </CardHeader>
                <CardFooter className="pt-6">
                  <Button 
                    onClick={() => setActiveTab("create-team")} 
                    className="w-full sm:w-auto"
                  >
                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                    Criar Nova Equipe
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="bg-card rounded-lg border shadow-sm">
                  <TeamList 
                    teams={teams}
                    selectedTeamId={selectedTeam?.id}
                    userEmail={user?.email || null}
                    onSelectTeam={handleTeamSelect}
                  />
                </div>

                {selectedTeam && (
                  <div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
                    <TeamDetails
                      teamId={selectedTeam.id}
                      members={teamMembers}
                      currentUserEmail={user?.email || null}
                      surveyStatus={surveyStatus}
                      onContinue={handleNext}
                      inviteMessage={inviteMessage}
                      onInviteMessageChange={setInviteMessage}
                      onSendInvite={handleSendInvite}
                      isSendingInvite={isSendingInvite}
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create-team">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <CreateTeamForm
                userEmail={user?.email || null}
                isSubmitting={isSubmitting}
                onSubmit={handleCreateTeamSubmit}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

