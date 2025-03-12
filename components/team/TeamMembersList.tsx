import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, UserStatus } from '@/resources/auth/auth-model';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TeamMembersListProps {
  teamId: string;
}

export function TeamMembersList({ teamId }: TeamMembersListProps) {
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Função para carregar os membros da equipe
  const loadTeamMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('team_id', teamId);

      if (error) throw error;

      setMembers(data as User[]);
    } catch (error: any) {
      console.error('Erro ao carregar membros da equipe:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar membros da equipe quando o componente for montado
  useEffect(() => {
    if (teamId) {
      loadTeamMembers();
    }
  }, [teamId]);

  // Configurar um listener para atualizações em tempo real
  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel('team-members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
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
          {members.length} {members.length === 1 ? 'membro' : 'membros'} na equipe
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-muted-foreground">Nenhum membro na equipe ainda.</p>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={member.avatar_url || ''} alt={member.name || member.email} />
                    <AvatarFallback>
                      {member.name ? getInitials(member.name) : member.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name || member.email}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <Badge
                  variant={member.status === UserStatus.RESPONDED ? 'default' : 'outline'}
                >
                  {member.status || UserStatus.INVITED}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 