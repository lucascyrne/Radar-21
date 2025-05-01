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
import supabase from "@/lib/supabase/client";
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
  const [isMounted, setIsMounted] = useState(false);
  const [totalMembers, setTotalMembers] = useState<Record<string, number>>({});
  const [completionPercentages, setCompletionPercentages] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!user) {
      console.log(
        "Usuário não autenticado em team-setup, redirecionando para /members/login"
      );
      router.push("/members/login");
      return;
    }

    console.log("Usuário autenticado em team-setup:", {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
    });

    const initializeTeams = async () => {
      if (user.id) {
        await loadTeams(user.id);
        setTeamsLoaded(true);
      }
    };

    initializeTeams();
  }, [user]);

  useEffect(() => {
    if (selectedTeam && user?.email) {
      const message = generateInviteMessage(selectedTeam.name, user.email);
      setInviteMessage(message);
    }
  }, [
    selectedTeam?.id,
    user?.email,
    generateInviteMessage,
    selectedTeam?.name,
  ]);

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
            setSurveyStatus("not_member");
            return;
          }
          console.error("Erro ao verificar membro da equipe:", memberError);
          setSurveyStatus("error");
          return;
        }

        const hasAnswered = memberData.status === "answered";
        setSurveyStatus(hasAnswered ? "success" : "not_member");

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

    checkSurveyStatus();
  }, [selectedTeam?.id, user?.email]);

  // Efeito para calcular totalMembers e completionPercentages
  useEffect(() => {
    const calculateTeamStats = async () => {
      const membersCount: Record<string, number> = {};
      const completionPercs: Record<string, number> = {};

      for (const team of teams) {
        try {
          const { data: members } = await supabase
            .from("team_members")
            .select("*")
            .eq("team_id", team.id);

          if (members) {
            membersCount[team.id] = members.length;
            const answeredMembers = members.filter(
              (m) => m.status === "answered"
            ).length;
            completionPercs[team.id] =
              members.length > 0
                ? Math.round((answeredMembers / members.length) * 100)
                : 0;
          }
        } catch (error) {
          console.error(
            `Erro ao buscar estatísticas da equipe ${team.id}:`,
            error
          );
          membersCount[team.id] = 0;
          completionPercs[team.id] = 0;
        }
      }

      setTotalMembers(membersCount);
      setCompletionPercentages(completionPercs);
    };

    if (teams.length > 0) {
      calculateTeamStats();
    }
  }, [teams]);

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

        const inviteUrl = `${window.location.origin}/members?invite=${
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

    router.push(surveyComplete ? "/open-questions" : "/survey");
  }, [selectedTeam?.id, user?.id, router]);

  const handleTeamSelect = useCallback(
    async (teamId: string) => {
      if (!user?.id) return;

      selectTeam(teamId);
      await loadTeamMembers(teamId);
    },
    [user?.id]
  );

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <TeamSkeleton />
          <TeamSkeleton />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const hasOrganization = user?.organization_id;

  if (!isMounted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-3xl flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

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
              <TeamList
                teams={teams}
                selectedTeamId={selectedTeam?.id}
                userEmail={user?.email || ""}
                onSelectTeam={handleTeamSelect}
                totalMembers={totalMembers}
                completionPercentages={completionPercentages}
              />
            )}

            {selectedTeam && (
              <TeamDetails
                teamId={selectedTeam.id}
                members={teamMembers}
                currentUserEmail={user.email}
                surveyStatus={surveyStatus}
                onContinue={handleNext}
                inviteMessage={inviteMessage}
                onInviteMessageChange={setInviteMessage}
                onSendInvite={handleSendInvite}
                isSendingInvite={isSendingInvite}
              />
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
                            Você está vinculado a uma organização. Aguarde seu
                            gestor atribuí-lo a uma equipe para começar a
                            avaliação.
                            <br />
                            <br />
                            Se você é líder de uma pequena equipe e deseja criar
                            sua própria equipe independente, entre em contato
                            com o suporte para ajustar seu perfil.
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
                            <li>Aguarde seu gestor atribuí-lo a uma equipe</li>
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
                          <li>Crie sua própria equipe ou aguarde um convite</li>
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
          </TabsContent>

          <TabsContent value="create-team">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <CreateTeamForm
                userEmail={user.email || ""}
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
