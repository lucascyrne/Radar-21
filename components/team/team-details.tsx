import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';
import { TeamInvite } from './team-invite';
import { TeamStatusList } from './team-status-list';
import { TeamMember } from '@/resources/team/team-model';

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
  surveyStatus,
  inviteMessage,
  onInviteMessageChange,
  onSendInvite,
  isSendingInvite,
  onContinue
}: TeamDetailsProps) {
  // Verificar se o usuário atual já respondeu a pesquisa
  const currentMember = members.find(m => m.email === currentUserEmail);
  const hasAnswered = currentMember?.status === 'answered';
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Convidar Equipe</CardTitle>
      </CardHeader>
      <CardContent>
        <TeamInvite
          inviteMessage={inviteMessage}
          onInviteMessageChange={onInviteMessageChange}
          onSendInvite={onSendInvite}
          isSendingInvite={isSendingInvite}
        />
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Status da Equipe</h3>
          <TeamStatusList
            members={members}
            currentUserEmail={currentUserEmail}
            surveyStatus={surveyStatus}
            selectedTeamId={teamId}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onContinue} 
          className="w-full flex items-center justify-center"
        >
          {hasAnswered ? 'Ver Resultados' : 'Continuar para Perfil'}
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
} 