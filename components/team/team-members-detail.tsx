import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import supabase from "@/lib/supabase/client";
import { TeamMember, TeamMemberStatus } from "@/resources/team/team-model";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface TeamMembersDetailProps {
  teamId: string;
}

// Funções utilitárias
const getInitials = (email: string) => {
  return email.substring(0, 2).toUpperCase();
};

const getStatusBadge = (status: TeamMemberStatus) => {
  switch (status) {
    case "answered":
      return <Badge variant="default">Respondido</Badge>;
    case "pending_survey":
      return <Badge variant="secondary">Pendente</Badge>;
    case "invited":
      return <Badge variant="outline">Convidado</Badge>;
    default:
      return null;
  }
};

export function TeamMembersDetail({ teamId }: TeamMembersDetailProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para atualizar o papel do membro
  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      // Verificar se já existe um líder (exceto o membro atual)
      if (newRole === "leader") {
        const existingLeader = members.find(
          (m) => m.role === "leader" && m.id !== memberId
        );
        if (existingLeader) {
          // Atualizar o líder existente para membro primeiro
          const { error: leaderError } = await supabase
            .from("team_members")
            .update({ role: "member" })
            .eq("id", existingLeader.id);

          if (leaderError) throw leaderError;
        }
      }

      // Atualizar o papel do membro selecionado
      const { error: updateError } = await supabase
        .from("team_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (updateError) throw updateError;

      // Atualizar o estado local
      setMembers((prevMembers) =>
        prevMembers.map((member) => {
          if (member.id === memberId) {
            return { ...member, role: newRole as "leader" | "member" };
          }
          if (newRole === "leader" && member.role === "leader") {
            return { ...member, role: "member" };
          }
          return member;
        })
      );

      toast.success(
        `O membro agora é ${
          newRole === "leader" ? "líder" : "membro"
        } da equipe.`
      );
    } catch (error: any) {
      console.error("Erro ao atualizar papel:", error);
      toast.error("Erro ao atualizar papel:", {
        description: error.message,
      });
    }
  };

  // Função para carregar os membros da equipe
  const loadTeamMembers = async () => {
    if (!teamId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId)
        .order("role", { ascending: false })
        .order("status", { ascending: true });

      if (error) throw error;

      setMembers(data as TeamMember[]);
    } catch (error: any) {
      console.error("Erro ao carregar membros da equipe:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Configurar um listener para atualizações em tempo real
  useEffect(() => {
    if (!teamId) return;

    // Carregar membros inicialmente
    loadTeamMembers();

    // Configurar listener para mudanças
    const channel = supabase
      .channel("team-members-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_members",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          loadTeamMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  // Renderizar esqueletos de carregamento
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>Carregando membros da equipe...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar mensagem de erro
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription className="text-red-500">
            Erro ao carregar membros: {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membros da Equipe</CardTitle>
        <CardDescription>
          {members.length} {members.length === 1 ? "membro" : "membros"} na
          equipe
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum membro na equipe ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{getInitials(member.email)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.email}</p>
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        updateMemberRole(member.id, value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leader">Líder</SelectItem>
                        <SelectItem value="member">Membro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {getStatusBadge(member.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TeamMembersListProps {
  members: TeamMember[];
  currentUserEmail: string | null;
}

export function TeamMembersList({
  members,
  currentUserEmail,
}: TeamMembersListProps) {
  // Se não tiver membros, mostrar mensagem informativa
  if (!members || members.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground p-4">
            <p>Nenhum membro encontrado nesta equipe.</p>
            <p className="text-sm mt-2">
              Convide membros para participar da avaliação.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ordenar membros: líder primeiro, depois por status (respondido > pendente > convidado)
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "leader" && b.role !== "leader") return -1;
    if (a.role !== "leader" && b.role === "leader") return 1;

    const statusOrder = {
      answered: 0,
      pending_survey: 1,
      invited: 2,
    };

    return statusOrder[a.status] - statusOrder[b.status];
  });

  // Função para obter a cor do badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "answered":
        return <Badge variant="default">Respondido</Badge>;
      case "pending_survey":
        return <Badge variant="secondary">Pendente</Badge>;
      case "invited":
        return <Badge variant="outline">Convidado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {sortedMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center space-x-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(member.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {member.email}
                    {member.email === currentUserEmail && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Você)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.role === "leader" ? "Líder" : "Membro"}
                  </p>
                </div>
              </div>
              <div>{getStatusBadge(member.status)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
