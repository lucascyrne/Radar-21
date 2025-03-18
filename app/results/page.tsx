"use client"

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Info, HelpCircle } from 'lucide-react';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Custom Components
import { Layout } from '@/components/layout';
import { SetupProgress } from '@/components/team/setup-progress';
import { RadarChart } from '@/components/radar-chart';
import { TeamCompetencyDetails } from '@/components/team/team-competency-details';

// Hooks and Services
import { useAuth } from '@/resources/auth/auth-hook';
import { useTeam } from '@/resources/team/team-hook';
import { useSurvey } from '@/resources/survey/survey-hook';
import { RadarService } from '@/resources/survey/radar.service';
import { SurveyResponses } from '@/resources/survey/survey-model';

// Mapeamento de status para exibição em português
const statusLabels: Record<string, string> = {
  'invited': 'Convidado',
  'answered': 'Cadastrado',
};

// Mapeamento de status para cores
const statusColors: Record<string, string> = {
  'invited': 'bg-yellow-100 text-yellow-800',
  'answered': 'bg-blue-100 text-blue-800',
};

export default function ResultsPage() {
  const { user } = useAuth();
  const { selectedTeam, teamMembers, loadTeamMembers } = useTeam();
  const { teamMemberId, loadSurveyResponses, surveyResponses } = useSurvey();
  
  const [userResponses, setUserResponses] = useState<SurveyResponses | null>(null);
  const [leaderResponses, setLeaderResponses] = useState<SurveyResponses | null>(null);
  const [memberResponses, setMemberResponses] = useState<Record<string, SurveyResponses | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<Record<string, string>>({});
  
  // Carregar dados do radar
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Verificar se temos o ID da equipe
        const teamId = selectedTeam?.id || localStorage.getItem("teamId");
        if (!teamId) {
          throw new Error("ID da equipe não encontrado");
        }
        
        // Carregar membros da equipe se necessário
        if (teamMembers.length === 0) {
          await loadTeamMembers(teamId);
        }
        
        // Tentar obter o teamMemberId do contexto, localStorage ou buscar pelo email
        let currentTeamMemberId = teamMemberId || localStorage.getItem("teamMemberId");
        if (!currentTeamMemberId && user?.email) {
          const member = teamMembers.find(m => m.email === user.email);
          if (member?.id) {
            currentTeamMemberId = member.id;
            localStorage.setItem("teamMemberId", member.id);
          }
        }
        
        if (!currentTeamMemberId) {
          throw new Error("ID do membro da equipe não encontrado");
        }
        
        // Carregar respostas do usuário atual
        let userSurveyResponses = surveyResponses;
        if (!userSurveyResponses) {
          userSurveyResponses = await RadarService.loadMemberResponses(currentTeamMemberId);
        }
        setUserResponses(userSurveyResponses);
        
        // Carregar respostas de todos os membros da equipe
        const { memberResponses: teamMemberResponses, leaderResponses: teamLeaderResponses } = 
          await RadarService.loadTeamResponses(teamId, teamMembers);
        
        setMemberResponses(teamMemberResponses);
        setLeaderResponses(teamLeaderResponses);
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error);
        setError(error.message || "Erro ao carregar dados do radar");
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user, selectedTeam, teamMembers, teamMemberId, surveyResponses]);
  
  // Transformar dados para o formato do radar
  const userRadarData = useMemo(() => 
    RadarService.transformResponsesToRadarData(userResponses),
  [userResponses]);

   const teamAverageData = useMemo(() => 
    RadarService.calculateTeamAverage(memberResponses),
  [memberResponses]);
  
  // Obter detalhes por competência
  const competencyDetails = useMemo(() => 
    RadarService.getCompetencyDetails(leaderResponses, teamAverageData),
  [leaderResponses, teamAverageData]);

  
  // Verificar se há dados suficientes
  const hasUserData = userRadarData.length > 0;
  const hasTeamData = teamAverageData.length > 0;

  return (
    <Layout>
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
        <SetupProgress currentPhase="results" />
        <h1 className="text-3xl font-bold mb-6 text-center">Resultados da Avaliação</h1>
      
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!hasUserData && !isLoading && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Você ainda não respondeu ao questionário de competências. 
              Por favor, complete o questionário para visualizar seu radar.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="mb-4 w-full flex flex-wrap justify-between">
            <TabsTrigger value="individual" className="flex-1 min-w-0 text-xs sm:text-sm">Individual</TabsTrigger>
            <TabsTrigger value="team" className="flex-1 min-w-0 text-xs sm:text-sm">Comparativo</TabsTrigger>
            <TabsTrigger value="details" className="flex-1 min-w-0 text-xs sm:text-sm">Detalhes</TabsTrigger>
            <TabsTrigger value="members" className="flex-1 min-w-0 text-xs sm:text-sm">Membros</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual">
            <Card>
              <CardHeader>
                <CardTitle>Seu Radar de Competências</CardTitle>
                <CardDescription>
                  Visualização das suas competências baseada nas respostas do questionário
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[500px]">
                {isLoading ? (
                  <div className="flex flex-col space-y-4">
                    <Skeleton className="h-[450px] w-full rounded-lg" />
                  </div>
                ) : hasUserData ? (
                  <RadarChart data={userRadarData} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      Você ainda não respondeu ao questionário de competências.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Comparativo com a Equipe</CardTitle>
                <CardDescription>
                  Comparação entre suas competências e a média da equipe
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[500px]">
                {isLoading ? (
                  <div className="flex flex-col space-y-4">
                    <Skeleton className="h-[450px] w-full rounded-lg" />
                  </div>
                ) : hasUserData && hasTeamData ? (
                  <RadarChart 
                    data={userRadarData} 
                    compareData={teamAverageData} 
                    compareLabel="Média da Equipe" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      {!hasUserData 
                        ? "Você ainda não respondeu ao questionário de competências."
                        : "Não há dados suficientes da equipe para comparação."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes por Competência</CardTitle>
                <CardDescription>
                  Análise detalhada de cada competência comparando sua avaliação pessoal com a média da equipe.
                  Um valor positivo (verde) indica que a equipe avalia melhor que você nesta competência.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col space-y-4">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ) : (
                  <TeamCompetencyDetails 
                    competencyDetails={competencyDetails}
                    isLoading={isLoading}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Membros da Equipe</CardTitle>
                <CardDescription>
                  Status de resposta ao questionário de todos os membros da equipe
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex flex-col space-y-4">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ) : teamMembers.length > 0 ? (
                  <div className="min-w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome/Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Respostas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamMembers.map((member) => {
                          const hasResponses = member.id && memberResponses[member.id] !== null && memberResponses[member.id] !== undefined;
                          const isCurrentUser = member.email === user?.email;
                          const displayName = member.email?.split('@')[0] || 'Usuário';
                          
                          return (
                            <TableRow key={member.id} className={isCurrentUser ? 'bg-blue-50' : ''}>
                              <TableCell className="max-w-[200px] break-words">
                                <div className="font-medium">{displayName}</div>
                                <div className="text-sm text-gray-500 truncate">{member.email}</div>
                                {isCurrentUser && <Badge className="mt-1 bg-blue-100 text-blue-800">Você</Badge>}
                              </TableCell>
                              <TableCell>
                                <Badge className={`transition-none pointer-events-none ${statusColors[member.status || 'invited']}`}>
                                  {statusLabels[member.status || 'invited']}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {member.id && loadingStatus[member.id] === 'loading' ? (
                                  <Skeleton className="h-6 w-20" />
                                ) : hasResponses ? (
                                  <Badge className="transition-none pointer-events-none bg-green-100 text-green-800">Respondido</Badge>
                                ) : (
                                  <Badge className="transition-none pointer-events-none bg-gray-100 text-gray-800">Pendente</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">
                      Não há membros na equipe.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

