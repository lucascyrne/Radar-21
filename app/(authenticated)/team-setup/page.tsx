"use client";

import { useAuth } from "@/resources/auth/auth-hook";
import { SurveyService } from "@/resources/survey/survey.service";
import { useTeam } from "@/resources/team/team-hook";
import { CreateTeamFormValues } from "@/resources/team/team-model";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// Componentes UI
import { Layout } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/resources/auth/auth.service";
import { PlusCircleIcon } from "lucide-react";

// Componentes personalizados
import { CreateTeamForm } from "@/components/team/create-team-form";
import { TeamDetails } from "@/components/team/team-details";
import { TeamList } from "@/components/team/team-list";
import { toast } from "sonner";

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

  // Verificar autenticação antes de prosseguir
  if (!user || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const {
    teams,
    selectedTeam,
    teamMembers,
    createTeam,
    loadTeams,
    loadTeamMembers,
    generateInviteMessage,
    resetTeamsLoaded,
    selectTeam,
    isLoading: teamsLoading,
  } = useTeam();
  const [activeTab, setActiveTab] = useState<string>("my-teams");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [surveyStatus, setSurveyStatus] = useState<
    "loading" | "not_member" | "error" | "success"
  >("not_member");
  const [teamsLoaded, setTeamsLoaded] = useState(false);

  const hasOrganization = !!user.organization_id;

  // Efeito para redirecionar se não estiver autenticado
  useEffect(() => {
    if (!user) {
      router.push("/auth");
    }
  }, [user]);

  // Efeito para carregar equipes do usuário uma única vez
  useEffect(() => {
    const loadUserTeams = async () => {
      if (user?.id && !teamsLoaded) {
        await loadTeams(user.id);
        setTeamsLoaded(true);
      }
    };

    loadUserTeams();
  }, [user?.id, teamsLoaded]);

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
        setSurveyStatus("not_member");
        return;
      }

      try {
        const { data: memberData, error: memberError } = await supabase
          .from("team_members")
          .select("*")
          .eq("team_id", selectedTeam.id)
          .eq("email", user.email)
          .single();

        if (memberError) {
          if (memberError.code === "PGRST116") {
            // Usuário não é membro da equipe - comportamento esperado
            setSurveyStatus("not_member");
            return;
          }
          // Erro real do sistema
          console.error("Erro ao verificar membro da equipe:", memberError);
          setSurveyStatus("error");
          return;
        }

        // Verificar se o usuário já respondeu a pesquisa
        const hasAnswered = memberData.status === "answered";

        setSurveyStatus(hasAnswered ? "success" : "not_member");

        // Se o usuário está autenticado mas ainda não está registrado, atualizar para "invited"
        if (memberData.status === "invited") {
          await supabase
            .from("team_members")
            .update({ status: "invited" })
            .eq("id", memberData.id);
        }
      } catch (error) {
        console.error("Erro ao verificar status da pesquisa:", error);
        setSurveyStatus("error");
      }
    };

    if (selectedTeam?.id && user?.email) {
      checkSurveyStatus();
    }
  }, [selectedTeam?.id, user?.email]);

  // Handlers
  const handleCreateTeamSubmit = useCallback(
    async (data: CreateTeamFormValues) => {
      if (!user) return;

      setIsSubmitting(true);

      try {
        await createTeam(data, user.id, user.email || "");
        resetTeamsLoaded();
        setActiveTab("my-teams");

        toast.success("Equipe criada com sucesso!", {
          description: "Agora você pode convidar membros para sua equipe.",
        });
      } catch (error: any) {
        console.error("Erro ao criar equipe:", error);
        toast.error("Erro ao criar equipe", {
          description:
            error.message || "Erro ao criar equipe. Tente novamente.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [user]
  );

  const handleSendInvite = useCallback(
    async (email: string) => {
      setIsSendingInvite(true);
      try {
        if (!selectedTeam || !user?.email) return;

        const inviteUrl = `${window.location.origin}/auth?invite=${
          selectedTeam.id
        }&email=${encodeURIComponent(email)}`;

        await fetch("/api/send-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            inviteUrl,
            message: inviteMessage,
            teamId: selectedTeam.id,
            teamName: selectedTeam.name,
            invitedBy: user.email,
          }),
        });

        // Forçar recarregamento dos membros
        loadTeamMembers(selectedTeam.id);

        toast.success("Convite enviado", {
          description:
            "O membro foi adicionado à equipe e recebeu um email de convite.",
        });
      } catch (error: any) {
        toast.error("Erro ao enviar convite", {
          description: error.message || "Ocorreu um erro ao enviar o convite.",
        });
      } finally {
        setIsSendingInvite(false);
      }
    },
    [selectedTeam, user?.email, inviteMessage]
  );

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const handleNext = useCallback(async () => {
    if (!selectedTeam?.id || !user?.id) return;

    const surveyComplete = await SurveyService.checkSurveyCompletion(
      user.id,
      selectedTeam.id
    );

    if (surveyComplete) {
      router.push("/open-questions");
    } else {
      router.push("/survey");
    }
  }, [selectedTeam?.id, user?.id, router]);

  const handleTeamSelect = useCallback(
    async (teamId: string) => {
      if (!user?.id) return;

      // Atualizar a equipe selecionada no contexto
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        selectTeam(teamId);
        await loadTeamMembers(teamId);
      }
    },
    [user?.id, teams]
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-3xl">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Configuração da Equipe
          </h1>
          <p className="text-muted-foreground">
            {user?.role === "LEADER"
              ? "Crie uma nova equipe ou gerencie suas equipes existentes para começar a avaliação."
              : "Participe de uma equipe existente ou crie sua própria equipe para começar a avaliação."}
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <div className="flex justify-center w-full">
            <TabsList>
              <TabsTrigger value="my-teams">Minhas Equipes</TabsTrigger>
              <TabsTrigger value="create-team">Criar Nova Equipe</TabsTrigger>
            </TabsList>
          </div>

          {surveyStatus === "error" && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                Ocorreu um erro ao verificar o status da pesquisa. Por favor,
                tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value="my-teams" className="space-y-6">
            {teamsLoading && !teamsLoaded ? (
              <div className="space-y-4">
                <TeamSkeleton />
                <TeamSkeleton />
              </div>
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
                  <>
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
                  </>
                )}

                {teams.length === 0 && (
                  <Card className="bg-card">
                    <CardHeader className="space-y-2">
                      <CardTitle>Bem-vindo ao Radar21!</CardTitle>
                      <p className="text-muted-foreground text-sm">
                        {user?.role === "LEADER" ? (
                          <>
                            {hasOrganization ? (
                              <>
                                Você está vinculado a uma organização. Aguarde
                                seu gestor atribuí-lo a uma equipe para começar
                                a avaliação.
                                <br />
                                <br />
                                Se você é líder de uma pequena equipe e deseja
                                criar sua própria equipe independente, entre em
                                contato com o suporte para ajustar seu perfil.
                              </>
                            ) : (
                              <>
                                Como líder, você pode criar sua própria equipe e
                                convidar membros para participar da avaliação.
                                <br />
                                <br />
                                <span className="font-bold text-red-400">
                                  Atenção:
                                </span>{" "}
                                Se você faz parte de uma organização maior, é
                                recomendado que seu gestor (usuário com papel de
                                Organização) crie a equipe e atribua você como
                                líder.
                              </>
                            )}
                          </>
                        ) : (
                          "Você ainda não faz parte de nenhuma equipe. Você pode criar sua própria equipe ou aguardar um convite de um líder."
                        )}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg bg-muted p-4">
                        <h3 className="font-semibold mb-2">Próximos passos:</h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                          {user?.role === "LEADER" ? (
                            hasOrganization ? (
                              <>
                                <li>
                                  Aguarde seu gestor atribuí-lo a uma equipe
                                </li>
                                <li>
                                  Após ser atribuído, você poderá gerenciar sua
                                  equipe
                                </li>
                                <li>
                                  Convide membros para participar da avaliação
                                </li>
                                <li>Aguarde as respostas dos membros</li>
                                <li>Analise os resultados da avaliação</li>
                              </>
                            ) : (
                              <>
                                <li>
                                  Crie uma nova equipe clicando no botão abaixo
                                </li>
                                <li>
                                  Convide membros para participar da sua equipe
                                </li>
                                <li>Aguarde as respostas dos membros</li>
                                <li>Analise os resultados da avaliação</li>
                              </>
                            )
                          ) : (
                            <>
                              <li>
                                Crie sua própria equipe ou aguarde um convite
                              </li>
                              <li>
                                Após entrar em uma equipe, responda a avaliação
                              </li>
                              <li>
                                Contribua para o desenvolvimento da sua equipe
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-6">
                      {user?.role === "LEADER" && !hasOrganization && (
                        <Button
                          onClick={() => setActiveTab("create-team")}
                          className="w-full sm:w-auto"
                        >
                          <PlusCircleIcon className="mr-2 h-4 w-4" />
                          Criar Nova Equipe
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
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
