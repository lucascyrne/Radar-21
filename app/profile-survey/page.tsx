"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Layout } from "@/components/layout"
import { useToast } from "@/hooks/use-toast"
import { useSurvey } from "@/resources/survey/survey-hook"
import { ProfileFormValues } from "@/resources/survey/survey-model"
import { useAuth } from "@/resources/auth/auth-hook"
import { useTeam } from "@/resources/team/team-hook"
import { ProfileForm } from "@/components/survey/profile-form"
import { PrivacyNotice } from "@/components/survey/privacy-notice"

export default function ProfileSurveyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { currentMember } = useTeam()
  const { saveProfile, profile, error, updateTeamMemberId } = useSurvey()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Definir o ID do membro da equipe quando disponível
  useEffect(() => {
    if (currentMember?.id) {
      console.log('Profile - Setting team member ID:', currentMember.id);
      updateTeamMemberId(currentMember.id)
      localStorage.setItem("teamMemberId", currentMember.id)
    }
  }, [currentMember, updateTeamMemberId])

  // Exibir mensagem de erro se houver
  useEffect(() => {
    if (error) {
      console.error('Profile - Error from survey context:', error);
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      })
    }
  }, [error])

  const handleSubmit = useCallback(async (data: ProfileFormValues) => {
    console.log('Profile - handleSubmit called with data:', data);
    try {
      setIsSubmitting(true)
      
      // Obter teamMemberId do estado atual ou do localStorage
      const memberId = currentMember?.id || localStorage.getItem("teamMemberId")
      console.log('Profile - Using team member ID:', memberId);
      
      // Verificar se temos o ID do membro da equipe
      if (!memberId) {
        throw new Error("ID do membro da equipe não encontrado. Por favor, tente novamente.")
      }
      
      // Garantir que employee_count seja um número
      const formattedData = {
        ...data,
        employee_count: typeof data.employee_count === 'string' 
          ? parseInt(data.employee_count, 10) || 0 
          : data.employee_count || 0
      }
      
      // Salvar no localStorage para compatibilidade com o código existente
      localStorage.setItem("userProfile", JSON.stringify(formattedData))
      localStorage.setItem("userEmail", user?.email || "")
      
      console.log('Profile - Saving profile data:', formattedData);
      const success = await saveProfile(formattedData)
      console.log('Profile - Save result:', success);
      
      if (success) {
        toast({
          title: "Perfil salvo",
          description: "Seu perfil foi salvo com sucesso!",
        })
        
        // Aguardar um momento para garantir que os dados foram salvos
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('Profile - Redirecting to survey page');
        router.push("/survey")
      } else {
        throw new Error("Não foi possível salvar o perfil. Por favor, tente novamente.")
      }
    } catch (error: any) {
      console.error("Profile - Error in handleSubmit:", error)
      toast({
        title: "Erro ao salvar perfil",
        description: error.message || "Ocorreu um erro ao salvar seu perfil.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [currentMember?.id, user?.email])

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-3xl">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Perfil do Participante</h1>
          <p className="text-muted-foreground">
            Por favor, preencha as informações abaixo para começar a pesquisa.
            Suas respostas são confidenciais e serão usadas apenas para fins acadêmicos.
          </p>
        </div>
        
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <ProfileForm onSubmit={handleSubmit} />
        </div>

        <div className="bg-secondary/10 rounded-lg p-6">
          <PrivacyNotice />
        </div>
      </div>
    </Layout>
  )
}

