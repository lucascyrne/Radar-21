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

export default function Profile() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { selectedTeam, currentMember, loadTeamMembers } = useTeam()
  const { saveProfile, profile, error, updateTeamMemberId } = useSurvey()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Verificar se o usuário está em uma equipe
  useEffect(() => {
    const teamId = localStorage.getItem("teamId") || selectedTeam?.id
    if (!teamId && !user?.team_id) {
      router.push("/team-setup")
    } else if (teamId && user?.email) {
      // Carregar membros da equipe para garantir que temos o currentMember
      loadTeamMembers(teamId)
    }
  }, [user, selectedTeam, loadTeamMembers, router])

  // Definir o ID do membro da equipe quando disponível
  useEffect(() => {
    if (currentMember?.id) {
      updateTeamMemberId(currentMember.id)
    }
  }, [currentMember, updateTeamMemberId])

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
      
      // Verificar se temos o ID do membro da equipe
      if (!currentMember?.id) {
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
      localStorage.setItem("teamMemberId", currentMember.id)
      
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
  }, [currentMember?.id, saveProfile, user?.email, router, toast]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <SetupProgress currentPhase="profile" />
        <h1 className="text-3xl font-bold mb-8 text-center">Seu Perfil</h1>

        <ProfileForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          defaultValues={profile || undefined}
        />
      </div>
    </Layout>
  )
}

