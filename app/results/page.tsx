"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart } from '@/components/radar-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/resources/auth/auth-hook';
import { useTeam } from '@/resources/team/team-hook';
import { useSurvey } from '@/resources/survey/survey-hook';
import { SurveyResponses } from '@/resources/survey/survey-model';
import { RadarService } from '@/resources/survey/radar.service';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info, Download } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { SetupProgress } from '@/components/team/setup-progress';

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
  const [teamResponses, setTeamResponses] = useState<SurveyResponses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberResponses, setMemberResponses] = useState<Record<string, SurveyResponses | null>>({});
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
        
        // Carregar respostas do usuário atual
        let userSurveyResponses = surveyResponses;
        if (!userSurveyResponses && teamMemberId) {
          userSurveyResponses = await loadSurveyResponses();
        }
        setUserResponses(userSurveyResponses);
        
        // Carregar respostas de todos os membros da equipe
        const allMemberResponses = await RadarService.loadTeamResponses(teamId, teamMembers);
        setMemberResponses(allMemberResponses);
        
        // Filtrar apenas respostas válidas para o cálculo da média
        const validResponses = Object.values(allMemberResponses).filter(Boolean) as SurveyResponses[];
        setTeamResponses(validResponses);
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Erro ao carregar dados do radar:', error);
        setError(error.message || 'Erro ao carregar dados do radar');
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, selectedTeam, teamMembers, teamMemberId, loadTeamMembers, loadSurveyResponses, surveyResponses]);
  
  // Transformar dados para o formato do radar
  const userRadarData = RadarService.transformResponsesToRadarData(userResponses);
  const teamAverageData = RadarService.calculateTeamAverage(teamResponses);
  
  // Obter detalhes por competência
  const competencyDetails = RadarService.getCompetencyDetails(userResponses, teamAverageData);
  
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
                <CardTitle>Detalhes por Tópico</CardTitle>
                <CardDescription>
                  Análise detalhada de cada tópico comparado com a média da equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col space-y-4">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ) : competencyDetails.length > 0 ? (
                  <div className="space-y-6">
                    {competencyDetails.map((item) => (
                      <div key={item.topic} className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <h3 className="font-medium">{item.topic}</h3>
                          <div className="flex flex-wrap gap-2 sm:gap-4">
                            <span className="text-blue-600 font-medium text-sm sm:text-base">Você: {item.userScore}</span>
                            <span className="text-green-600 font-medium text-sm sm:text-base">Equipe: {item.teamAverage.toFixed(1)}</span>
                            <span className={`font-medium text-sm sm:text-base ${item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                              {item.difference > 0 ? '+' : ''}{item.difference.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2 items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(item.userScore / 5) * 100}%` }}></div>
                          </div>
                          <span className="text-sm text-gray-500 w-10 text-right">{item.userScore}/5</span>
                        </div>
                        <div className="flex space-x-2 items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(item.teamAverage / 5) * 100}%` }}></div>
                          </div>
                          <span className="text-sm text-gray-500 w-10 text-right">{item.teamAverage.toFixed(1)}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">
                      Não há dados suficientes para exibir detalhes por tópico.
                    </p>
                  </div>
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
                                <Badge className={statusColors[member.status || 'invited']}>
                                  {statusLabels[member.status || 'invited']}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {member.id && loadingStatus[member.id] === 'loading' ? (
                                  <Skeleton className="h-6 w-20" />
                                ) : hasResponses ? (
                                  <Badge className="bg-green-100 text-green-800">Respondido</Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">Pendente</Badge>
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

