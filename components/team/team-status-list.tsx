import { Badge } from "@/components/ui/badge";
import { TeamMember } from "@/resources/team/team-model";

const statusLabels: Record<string, string> = {
  invited: "Convidado",
  pending_survey: "Pesquisa Pendente",
  answered: "Respondido",
};

const statusColors: Record<string, string> = {
  invited: "bg-yellow-500",
  pending_survey: "bg-blue-500",
  answered: "bg-green-500",
};

interface TeamStatusListProps {
  members: TeamMember[];
  currentUserId: string;
}

export function TeamStatusList({
  members,
  currentUserId,
}: TeamStatusListProps) {
  // Ordena os membros: usuário atual primeiro, depois líderes, depois outros membros
  const sortedMembers = [...members].sort((a, b) => {
    if (a.user_id === currentUserId) return -1;
    if (b.user_id === currentUserId) return 1;
    if (a.role === "leader" && b.role !== "leader") return -1;
    if (a.role !== "leader" && b.role === "leader") return 1;
    return 0;
  });

  if (!members.length) {
    return (
      <div className="text-center text-gray-500">
        Nenhum membro encontrado na equipe.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedMembers.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {member.email}
              </p>
              <p className="text-sm text-gray-500">
                {member.role === "leader" ? "Líder" : "Membro"}
              </p>
            </div>
          </div>
          <Badge
            className={`${statusColors[member.status]} text-white`}
            variant="secondary"
          >
            {statusLabels[member.status]}
          </Badge>
        </div>
      ))}
    </div>
  );
}
