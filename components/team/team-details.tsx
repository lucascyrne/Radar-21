import { useTeam } from "@/resources/team/team-hook";
import { TeamMember } from "@/resources/team/team-model";
import {
  SurveyProgressState,
  withSurveyProgress,
} from "../survey/survey-progress";
import InviteUserForm from "./invite-user-form";
import { SetupProgress } from "./setup-progress";
import { TeamMembersList } from "./team-members-detail";

interface TeamDetailsProps {
  teamId: string;
  members: TeamMember[];
  currentUserEmail: string | null;
  surveyStatus: string | Record<string, boolean>;
  inviteMessage: string;
  onInviteMessageChange: (message: string) => void;
  onSendInvite: (email: string) => Promise<void>;
  isSendingInvite: boolean;
  surveyProgress?: SurveyProgressState;
  onContinueSurvey?: () => void;
  onContinue?: () => void;
  progressPercentage?: number;
}

function TeamDetailsComponent({
  teamId,
  members = [],
  currentUserEmail,
  surveyProgress,
  onContinueSurvey,
  onContinue,
  progressPercentage = 0,
}: TeamDetailsProps) {
  const { selectedTeam } = useTeam();
  const { loadTeamMembers } = useTeam();

  // Verificar se temos dados válidos para renderizar
  if (!teamId || !selectedTeam) {
    return null;
  }

  // Determinar se o usuário atual é líder da equipe
  const isTeamLeader = members.some(
    (m) => m.email === currentUserEmail && m.role === "leader"
  );

  // Determinar se o usuário atual completou a pesquisa
  const hasCompletedSurvey = currentUserEmail
    ? members.some(
        (m) => m.email === currentUserEmail && m.status === "answered"
      )
    : false;

  return (
    <div className="space-y-6">
      {/* Progresso da pesquisa */}
      {surveyProgress && !surveyProgress.isLoading && (
        <div className="space-y-4">
          <SetupProgress
            hasProfile={surveyProgress.hasProfile}
            hasSurvey={surveyProgress.hasSurvey}
            hasOpenQuestions={surveyProgress.hasOpenQuestions}
            progress={progressPercentage}
            onContinue={onContinueSurvey || onContinue}
          />
        </div>
      )}

      {/* Lista de membros */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Membros da Equipe</h3>
        <TeamMembersList
          members={members}
          currentUserEmail={currentUserEmail}
        />
      </div>

      {/* Formulário de convite (apenas para líderes) */}
      {isTeamLeader && selectedTeam && (
        <div className="space-y-4">
          <InviteUserForm
            teamId={teamId}
            teamName={selectedTeam.name}
            ownerEmail={currentUserEmail || ""}
            onInviteSent={() => {
              // Atualizar a lista de membros após o envio do convite
              loadTeamMembers(teamId);
            }}
            existingMembers={members}
          />
        </div>
      )}
    </div>
  );
}

export const TeamDetails = withSurveyProgress(TeamDetailsComponent);
