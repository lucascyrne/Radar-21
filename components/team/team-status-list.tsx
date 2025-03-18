import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TeamMember } from '@/resources/team/team-model';
import { cn } from '@/lib/utils';

interface TeamStatusListProps {
  members: TeamMember[];
  currentUserEmail: string | null;
}

// Mapeamento de status para exibição em português
const statusLabels: Record<string, string> = {
  'invited': 'Convidado',
  'answered': 'Respondeu',
};

// Mapeamento de status para cores (sem hover)
const statusColors: Record<string, string> = {
  'invited': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800',
  'answered': 'bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800',
};

// Estilo base para badges sem hover
const baseBadgeStyle = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-none pointer-events-none";

export function TeamStatusList({ members, currentUserEmail }: TeamStatusListProps) {
  // Ordenar membros: primeiro o usuário atual, depois líderes, depois outros membros
  const sortedMembers = [...members].sort((a, b) => {
    // Colocar o usuário atual primeiro
    if (a.email === currentUserEmail) return -1;
    if (b.email === currentUserEmail) return 1;
    
    // Depois os líderes
    if (a.role === 'leader' && b.role !== 'leader') return -1;
    if (a.role !== 'leader' && b.role === 'leader') return 1;
    
    // Por fim, ordenar por email
    return a.email.localeCompare(b.email);
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMembers.length > 0 ? (
            sortedMembers.map((member) => {
              const isCurrentUser = member.email === currentUserEmail;
              
              return (
                <TableRow key={member.id} className={isCurrentUser ? 'bg-blue-50' : ''}>
                  <TableCell className="font-medium">
                    {member.email} {isCurrentUser && <span className="text-xs text-blue-600">(Você)</span>}
                  </TableCell>
                  <TableCell>
                    <span className={cn(baseBadgeStyle, "bg-gray-100 text-gray-800")}>
                      {member.role === 'leader' ? 'Líder' : 'Membro'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(baseBadgeStyle, statusColors[member.status])}>
                      {statusLabels[member.status]}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4">
                Nenhum membro encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 