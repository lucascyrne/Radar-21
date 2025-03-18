"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Layout } from "@/components/layout"
import { useToast } from "@/hooks/use-toast"
import { useSurvey } from "@/resources/survey/survey-hook"
import { ProfileFormValues } from "@/resources/survey/survey-model"
import { useAuth } from "@/resources/auth/auth-hook"
import { useTeam } from "@/resources/team/team-hook"
import { ProfileForm } from "@/components/survey/profile-form"
import { SetupProgress } from '@/components/team/setup-progress'
import { PrivacyNotice } from "@/components/survey/privacy-notice"

export default function Profile() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()
  const { selectedTeam, currentMember, loadTeamMembers } = useTeam()
  const { saveProfile, profile, error, updateTeamMemberId } = useSurvey()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  
  // Verificar se o usuário está em uma equipe - executado apenas uma vez na montagem inicial
  useEffect(() => {
    // Evitar redirecionamento durante Alt+Tab ou remontagens temporárias
    if (initialCheckDone) return;
    
    const checkTeam = async () => {
      try {
        // Obter teamId de todas as fontes possíveis
        const teamId = localStorage.getItem("teamId") || selectedTeam?.id || user?.team_id;
        const teamMemberId = localStorage.getItem("teamMemberId");
        
        console.log("Verificando associação com equipe:", { 
          teamId, 
          selectedTeam: selectedTeam?.id,
          userTeamId: user?.team_id,
          teamMemberId 
        });
        
        // Se não tiver um teamId válido E não for uma simples reconexão, redirecionar
        if (!teamId && isAuthenticated !== undefined) {
          console.log("Nenhuma equipe encontrada, redirecionando para seleção de equipe");
          router.push("/team-setup");
        } 
        // Se tiver um teamId e email, carregar membros
        else if (teamId && user?.email) {
          console.log("Equipe encontrada, carregando membros:", teamId);
          await loadTeamMembers(teamId);
        }
        
        // Marcar verificação inicial como concluída
        setInitialCheckDone(true);
      } catch (error) {
        console.error("Erro ao verificar equipe:", error);
        // Não redirecionar em caso de erro para evitar loops
        setInitialCheckDone(true);
      }
    };
    
    checkTeam();
  }, [isAuthenticated]); // Dependência reduzida para evitar execuções desnecessárias

  // Definir o ID do membro da equipe quando disponível
  useEffect(() => {
    if (currentMember?.id) {
      updateTeamMemberId(currentMember.id);
      // Salvar no localStorage para persistência
      localStorage.setItem("teamMemberId", currentMember.id);
    }
  }, [currentMember, updateTeamMemberId]);

  // Exibir mensagem de erro se houver
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSubmit = useCallback(async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true)
      
      // Obter teamMemberId do estado atual ou do localStorage
      const memberId = currentMember?.id || localStorage.getItem("teamMemberId");
      
      // Verificar se temos o ID do membro da equipe
      if (!memberId) {
        throw new Error("ID do membro da equipe não encontrado. Por favor, tente novamente.");
      }
      
      // Garantir que employee_count seja um número
      const formattedData = {
        ...data,
        employee_count: typeof data.employee_count === 'string' 
          ? parseInt(data.employee_count, 10) || 0 
          : data.employee_count || 0
      };
      
      // Salvar no localStorage para compatibilidade com o código existente
      localStorage.setItem("userProfile", JSON.stringify(formattedData))
      localStorage.setItem("userEmail", user?.email || "")
      
      console.log("Enviando dados do perfil:", formattedData);
      
      const result = await saveProfile(formattedData)
      
      if (result) {
        toast({
          title: "Perfil salvo",
          description: "Seu perfil foi salvo com sucesso!",
        })
        
        router.push("/survey")
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message || "Ocorreu um erro ao salvar seu perfil.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [currentMember?.id, user?.email, saveProfile, toast, router]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <SetupProgress currentPhase="profile" />
        <h1 className="text-3xl font-bold mb-8 text-center">Seu Perfil</h1>

        <PrivacyNotice />

        <ProfileForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          defaultValues={profile || undefined}
        />
      </div>
    </Layout>
  )
}

