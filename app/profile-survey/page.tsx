"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Layout } from "@/components/layout"
import { useToast } from "@/hooks/use-toast"
import { useSurvey } from "@/resources/survey/survey-hook"
import { ProfileFormValues } from "@/resources/survey/survey-model"
import { useTeam } from "@/resources/team/team-hook"
import { useAuth } from "@/resources/auth/auth-hook"
import { ProfileForm } from "@/components/survey/profile-form"
import { PrivacyNotice } from "@/components/survey/privacy-notice"

export default function ProfileSurveyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { selectedTeam } = useTeam()
  const { saveProfile, error, updateUserId, updateTeamId, loading } = useSurvey()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Definir os IDs quando disponíveis
  useEffect(() => {
    const setupIds = async () => {
      const teamId = selectedTeam?.id || localStorage.getItem("teamId")
      const userId = user?.id

      if (userId) {
        updateUserId(userId)
      }
      
      if (teamId) {
        updateTeamId(teamId)
        localStorage.setItem("teamId", teamId)
      }
    }
    
    setupIds()
  }, [selectedTeam?.id, user?.id])

  // Exibir mensagem de erro se houver
  useEffect(() => {
    if (error.profile) {
      toast({
        title: "Erro",
        description: error.profile,
        variant: "destructive",
      })
    }
  }, [error.profile, toast])

  const handleSubmit = useCallback(async (data: ProfileFormValues) => {
    try {
      if (isSubmitting || loading.saving) return
      
      setIsSubmitting(true)
      
      const userId = user?.id
      const teamId = selectedTeam?.id || localStorage.getItem("teamId")
      
      if (!userId || !teamId) {
        throw new Error("Por favor, aguarde enquanto carregamos suas informações ou faça login novamente.")
      }

      const formattedData = {
        ...data,
        employee_count: typeof data.employee_count === 'string' 
          ? parseInt(data.employee_count, 10) || 0 
          : data.employee_count || 0
      }
      
      const success = await saveProfile(formattedData)
      
      if (success) {
        toast({
          title: "Perfil salvo",
          description: "Seu perfil foi salvo com sucesso!",
        })
        
        router.push("/survey")
      } else {
        throw new Error("Não foi possível salvar o perfil. Por favor, tente novamente.")
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
  }, [user?.id, selectedTeam?.id, isSubmitting, loading.saving])

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

