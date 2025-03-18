"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/resources/auth/auth-hook';
import { useTeam } from '@/resources/team/team-hook';
import { CreateTeamFormValues } from '@/resources/team/team-model';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
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
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { 
    teams, 
    selectedTeam, 
    teamMembers, 
    isLoading: teamLoading,
    error: teamError,
    loadUserTeams,
    createTeam,
    selectTeam,
    generateInviteMessage,
    resetTeamsLoaded,
    resetMembersLoaded,
    loadTeamMembers
  } = useTeam();
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("my-teams");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [surveyStatus, setSurveyStatus] = useState<Record<string, boolean>>({});
  
  // Efeito para redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [authLoading, isAuthenticated]);

  // Efeito para carregar equipes do usuário uma única vez
  useEffect(() => {
    if (user?.id && isAuthenticated) {
      loadUserTeams(user.id);
    }
  }, [user?.id, isAuthenticated]);

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
      if (!selectedTeam?.id || !user?.email) return;
      
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', selectedTeam.id)
          .eq('email', user.email)
          .single();

        if (memberError) {
          if (memberError.code === 'PGRST116') {
            // Usuário não é membro da equipe
            setSurveyStatus(prev => ({
              ...prev,
              [selectedTeam.id]: false
            }));
          }
          return;
        }

        // Verificar se o usuário já respondeu a pesquisa
        const hasAnswered = memberData.status === 'answered';
        
        setSurveyStatus(prev => ({
          ...prev,
          [selectedTeam.id]: hasAnswered
        }));

        // Se o usuário está autenticado mas ainda não está registrado, atualizar para "invited"
        if (memberData.status === 'invited') {
          await supabase
            .from('team_members')
            .update({ status: 'invited' })
            .eq('id', memberData.id);
        }
      } catch (error) {
        console.error('Erro ao verificar status da pesquisa:', error);
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
  }, [user, createTeam, toast, resetTeamsLoaded]);

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
      resetMembersLoaded(selectedTeam.id);
      await loadTeamMembers(selectedTeam.id);
      
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
  }, [selectedTeam, user?.email, inviteMessage, toast, resetMembersLoaded, loadTeamMembers]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedTeam) {
      // Persistir o ID da equipe
      localStorage.setItem("teamId", selectedTeam.id);
      
      // Encontrar o membro atual
      const currentMember = teamMembers.find(m => m.email === user?.email);
      
      // Persistir o ID do membro se disponível
      if (currentMember?.id) {
        localStorage.setItem("teamMemberId", currentMember.id);
      }
      
      const hasAnswered = currentMember?.status === 'answered';
      
      // Redirecionar com base no status
      router.push(hasAnswered ? '/results' : '/profile-survey');
    }
  }, [selectedTeam, teamMembers, user?.email, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <SetupProgress currentPhase="team" />
        <h1 className="text-3xl font-bold mb-8 text-center">Minha Equipe</h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-teams">Minhas Equipes</TabsTrigger>
            <TabsTrigger value="create-team">Criar Nova Equipe</TabsTrigger>
          </TabsList>
          
          {teamError && (
            <Alert variant="destructive" className="mb-4 mt-4">
              <AlertDescription>{teamError}</AlertDescription>
            </Alert>
          )}
          
          <TabsContent value="my-teams">
            {teamLoading ? (
              <>
                <TeamSkeleton />
                <TeamSkeleton />
              </>
            ) : teams.length === 0 ? (
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
                    className="w-full"
                  >
                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                    Criar Nova Equipe
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <>
                <TeamList 
                  teams={teams}
                  selectedTeamId={selectedTeam?.id}
                  userEmail={user?.email || null}
                  onSelectTeam={selectTeam}
                />

                {selectedTeam && (
                  <div className="space-y-6 mt-6">
                    <TeamDetails
                      teamId={selectedTeam.id}
                      members={teamMembers}
                      currentUserEmail={user?.email || null}
                      surveyStatus={surveyStatus}
                      onContinue={handleContinue}
                      inviteMessage={inviteMessage}
                      onInviteMessageChange={setInviteMessage}
                      onSendInvite={handleSendInvite}
                      isSendingInvite={isSendingInvite}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="create-team">
            <CreateTeamForm
              userEmail={user?.email || null}
              isSubmitting={isSubmitting}
              onSubmit={handleCreateTeamSubmit}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

