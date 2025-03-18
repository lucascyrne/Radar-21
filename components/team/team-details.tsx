
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamStatusList } from './team-status-list';
import { ContinueButton } from './continue-button';
import { TeamMember } from '@/resources/team/team-model';
import { useTeam } from '@/resources/team/team-hook';
import InviteUserForm from './invite-user-form';

interface TeamDetailsProps {
  teamId: string;
  members: TeamMember[];
  currentUserEmail: string | null;
  surveyStatus: Record<string, boolean>;
  inviteMessage: string;
  onInviteMessageChange: (message: string) => void;
  onSendInvite: (email: string) => Promise<void>;
  isSendingInvite: boolean;
  onContinue: () => void;
}

export function TeamDetails({
  teamId,
  members,
  currentUserEmail,
  onContinue
}: TeamDetailsProps) {
  const { selectedTeam } = useTeam();
  const { loadTeamMembers } = useTeam();
  
  // Determinar se o usuário atual é líder da equipe
  const isTeamLeader = members.some(
    m => m.email === currentUserEmail && m.role === 'leader'
  );
  
  // Determinar se o usuário atual completou a pesquisa
  const hasCompletedSurvey = currentUserEmail ? 
    members.some(m => m.email === currentUserEmail && m.status === 'answered') : 
    false;


  return (
    <div className="mt-6 space-y-6">
      {/* Exibir seção de convite apenas para líderes */}
      {isTeamLeader && selectedTeam && (
        <InviteUserForm
          teamId={teamId}
          teamName={selectedTeam.name}
          ownerEmail={currentUserEmail || ''}
          onInviteSent={() => {
            // Atualizar a lista de membros após o envio do convite
            loadTeamMembers(teamId);
          }}
          existingMembers={members}
        />
      )}
      {/* Lista de status dos membros */}
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamStatusList members={members} currentUserEmail={currentUserEmail} />
        </CardContent>
      </Card>
      
      {/* Botão para continuar para a próxima etapa */}
      <ContinueButton 
        onContinue={onContinue} 
        hasCompletedSurvey={hasCompletedSurvey}
      />
    </div>
  );
} 