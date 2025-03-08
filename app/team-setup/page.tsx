"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/resources/auth/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTeamFormValues, JoinTeamFormValues, createTeamSchema, joinTeamSchema } from '@/resources/team/team-model';
import { TeamService } from '@/resources/team/team.service';
import Link from 'next/link';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

export default function TeamSetupPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamCreated, setTeamCreated] = useState(false);
  const [teamJoined, setTeamJoined] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isLoading, isAuthenticated, router]);

  // Carregar equipes do usuário
  useEffect(() => {
    const loadUserTeams = async () => {
      if (user) {
        try {
          const { teams, memberships } = await TeamService.getUserTeams(user.id);
          setUserTeams(teams);
          
          // Se o usuário já tem equipes, selecionar a primeira
          if (teams.length > 0) {
            setSelectedTeam(teams[0].id);
            loadTeamMembers(teams[0].id);
          }
        } catch (error) {
          console.error('Erro ao carregar equipes:', error);
        }
      }
    };
    
    loadUserTeams();
  }, [user]);

  // Carregar membros da equipe selecionada
  const loadTeamMembers = async (teamId: string) => {
    try {
      const members = await TeamService.getTeamMembers(teamId);
      setTeamMembers(members);
    } catch (error) {
      console.error('Erro ao carregar membros da equipe:', error);
    }
  };

  // Configuração do formulário de criação de equipe
  const createTeamForm = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      role: 'leader',
      team_size: 5,
    },
  });

  // Configuração do formulário de entrada em equipe
  const joinTeamForm = useForm<JoinTeamFormValues>({
    resolver: zodResolver(joinTeamSchema),
    defaultValues: {
      team_name: '',
      owner_email: '',
    },
  });

  // Manipuladores de envio de formulário
  const handleCreateTeamSubmit = async (data: CreateTeamFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Criar a equipe
      const team = await TeamService.createTeam(
        data.name,
        user.id,
        user.email || '',
        data.team_size
      );
      
      // Adicionar o criador como membro/líder
      await TeamService.addTeamMember(
        team.id,
        user.id,
        user.email || '',
        data.role as 'leader' | 'member',
        'registered'
      );
      
      // Gerar mensagem de convite
      const message = TeamService.generateInviteMessage(team.name, user.email || '');
      setInviteMessage(message);
      
      // Atualizar estado
      setTeamCreated(true);
      setSelectedTeam(team.id);
      
      // Recarregar equipes e membros
      const { teams } = await TeamService.getUserTeams(user.id);
      setUserTeams(teams);
      loadTeamMembers(team.id);
      
      toast({
        title: "Equipe criada com sucesso!",
        description: "Agora você pode convidar membros para sua equipe.",
      });
      
    } catch (error: any) {
      console.error('Erro ao criar equipe:', error);
      setError(error.message || 'Erro ao criar equipe. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinTeamSubmit = async (data: JoinTeamFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Encontrar a equipe pelo nome e email do proprietário
      const team = await TeamService.findTeamByNameAndOwner(data.team_name, data.owner_email);
      
      if (!team) {
        throw new Error('Equipe não encontrada. Verifique o nome da equipe e o email do proprietário.');
      }
      
      // Entrar na equipe
      await TeamService.joinTeam(team.id, user.id, user.email || '');
      
      // Atualizar estado
      setTeamJoined(true);
      setSelectedTeam(team.id);
      
      // Recarregar equipes e membros
      const { teams } = await TeamService.getUserTeams(user.id);
      setUserTeams(teams);
      loadTeamMembers(team.id);
      
      toast({
        title: "Você entrou na equipe com sucesso!",
        description: "Agora você pode ver os membros da equipe.",
      });
      
    } catch (error: any) {
      console.error('Erro ao entrar na equipe:', error);
      setError(error.message || 'Erro ao entrar na equipe. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copiar mensagem de convite para a área de transferência
  const copyInviteMessage = () => {
    navigator.clipboard.writeText(inviteMessage);
    toast({
      title: "Mensagem copiada!",
      description: "A mensagem de convite foi copiada para a área de transferência.",
    });
  };

  // Mudar equipe selecionada
  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
    loadTeamMembers(teamId);
  };

  // Limpar erros ao mudar de aba
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
    createTeamForm.reset();
    joinTeamForm.reset();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-4">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <h1 className="text-2xl font-bold">Radar das Competências 4.0</h1>
            <nav className="flex items-center space-x-1">
              <Button variant="ghost" className="font-medium" asChild>
                <Link href="/team-setup">Minha Equipe</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/profile">Meu Perfil</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/radar">Competências</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/results">Resultados</Link>
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" asChild>
                <Link href="/logout">Sair</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Minha Equipe</h2>
          
          {userTeams.length > 0 && (
            <div className="mb-8">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle>Minhas Equipes</CardTitle>
                  <CardDescription>Selecione uma equipe para ver seus membros</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-md mx-auto">
                    <Select value={selectedTeam || undefined} onValueChange={handleTeamChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma equipe" />
                      </SelectTrigger>
                      <SelectContent>
                        {userTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedTeam && teamMembers.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Membros da Equipe</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Papel</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>{member.role === 'leader' ? 'Líder' : 'Membro'}</TableCell>
                              <TableCell>
                                {member.status === 'invited' ? 'Convidado' : 
                                 member.status === 'registered' ? 'Cadastrado' : 'Respondido'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {selectedTeam && teamCreated && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Convide sua equipe</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Customize e envie a mensagem abaixo para sua equipe nos seus canais.
                      </p>
                      <Textarea 
                        value={inviteMessage} 
                        onChange={(e) => setInviteMessage(e.target.value)}
                        className="min-h-[100px] mb-2"
                      />
                      <Button onClick={copyInviteMessage}>Copiar Mensagem</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-3xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="create">Criar Equipe</TabsTrigger>
              <TabsTrigger value="join">Entrar em Equipe</TabsTrigger>
            </TabsList>
            
            {/* Exibir mensagens de erro */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Formulário de Criação de Equipe */}
            <TabsContent value="create">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle>Criar Nova Equipe</CardTitle>
                  <CardDescription>
                    Preencha os dados abaixo para criar sua equipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createTeamForm.handleSubmit(handleCreateTeamSubmit)} className="space-y-4 max-w-md mx-auto">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da equipe</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Equipe de Desenvolvimento"
                        {...createTeamForm.register('name')}
                      />
                      {createTeamForm.formState.errors.name && (
                        <p className="text-sm text-red-500">{createTeamForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Meu email</Label>
                      <Input
                        value={user?.email || ''}
                        disabled
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Meu papel é de</Label>
                      <RadioGroup 
                        defaultValue={createTeamForm.getValues('role')}
                        onValueChange={(value) => createTeamForm.setValue('role', value as 'leader' | 'member')}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="leader" id="leader" />
                          <Label htmlFor="leader">Líder da equipe</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="member" id="member" />
                          <Label htmlFor="member">Colaborador na equipe</Label>
                        </div>
                      </RadioGroup>
                      {createTeamForm.formState.errors.role && (
                        <p className="text-sm text-red-500">{createTeamForm.formState.errors.role.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="team_size">Número de pessoas na equipe</Label>
                      <Input
                        id="team_size"
                        type="number"
                        min="1"
                        {...createTeamForm.register('team_size', { valueAsNumber: true })}
                      />
                      {createTeamForm.formState.errors.team_size && (
                        <p className="text-sm text-red-500">{createTeamForm.formState.errors.team_size.message}</p>
                      )}
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Criando...' : 'Criar Equipe'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Formulário para Entrar em Equipe */}
            <TabsContent value="join">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle>Entrar em uma Equipe</CardTitle>
                  <CardDescription>
                    Preencha os dados abaixo para entrar em uma equipe existente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={joinTeamForm.handleSubmit(handleJoinTeamSubmit)} className="space-y-4 max-w-md mx-auto">
                    <div className="space-y-2">
                      <Label htmlFor="team_name">Nome da equipe</Label>
                      <Input
                        id="team_name"
                        placeholder="Ex: Equipe de Desenvolvimento"
                        {...joinTeamForm.register('team_name')}
                      />
                      {joinTeamForm.formState.errors.team_name && (
                        <p className="text-sm text-red-500">{joinTeamForm.formState.errors.team_name.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="owner_email">Email da pessoa que criou a equipe</Label>
                      <Input
                        id="owner_email"
                        type="email"
                        placeholder="Ex: lider@empresa.com"
                        {...joinTeamForm.register('owner_email')}
                      />
                      {joinTeamForm.formState.errors.owner_email && (
                        <p className="text-sm text-red-500">{joinTeamForm.formState.errors.owner_email.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Meu email</Label>
                      <Input
                        value={user?.email || ''}
                        disabled
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Entrando...' : 'Entrar na Equipe'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

