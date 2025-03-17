import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TeamMember } from '@/resources/team/team-model';
import { UserIcon } from 'lucide-react';

// Mapeamento de status para exibição
const STATUS_MAP = {
  invited: {
    label: 'Convidado',
    className: 'text-yellow-500'
  },
  answered: {
    label: 'Respondido',
    className: 'text-green-500'
  }
};

interface TeamStatusListProps {
  members: TeamMember[];
  currentUserEmail: string | null;
  surveyStatus: Record<string, boolean>;
  selectedTeamId: string;
}

export function TeamStatusList({ 
  members, 
  currentUserEmail,
  surveyStatus,
  selectedTeamId
}: TeamStatusListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.length === 0 ? (
          <TableRow>
            <TableCell colSpan={2} className="text-center py-4">
              Nenhum membro encontrado
            </TableCell>
          </TableRow>
        ) : (
          members.map(member => {
            const isCurrentUser = member.email === currentUserEmail;
            const statusKey = member.status as keyof typeof STATUS_MAP;
            const statusInfo = STATUS_MAP[statusKey] || STATUS_MAP.invited;
            
            return (
              <TableRow key={member.id}>
                <TableCell className="flex items-center">
                  {member.email}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Você
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={statusInfo.className}>
                    {statusInfo.label}
                  </span>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
} 