"use client";

import { Layout } from "@/components/layout";
import { DemographicForm } from "@/components/survey/demographic-form";
import { PrivacyNotice } from "@/components/survey/privacy-notice";
import { useAuth } from "@/resources/auth/auth-hook";
import { useSurvey } from "@/resources/survey/survey-hook";
import { DemographicData } from "@/resources/survey/survey-model";
import { useTeam } from "@/resources/team/team-hook";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProfileSurveyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedTeam } = useTeam();
  const { error, updateUserId, updateTeamId, loading, saveDemographicData } =
    useSurvey();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Definir os IDs quando disponíveis
  useEffect(() => {
    const setupIds = async () => {
      const teamId = selectedTeam?.id || localStorage.getItem("teamId");
      const userId = user?.id;

      if (userId) {
        updateUserId(userId);
      }

      if (teamId) {
        updateTeamId(teamId);
        localStorage.setItem("teamId", teamId);
      }
    };

    setupIds();
  }, [selectedTeam?.id, user?.id]);

  // Exibir mensagem de erro se houver
  useEffect(() => {
    if (error.demographicData) {
      toast.error(error.demographicData);
    }
  }, [error.demographicData, toast]);

  const handleSubmit = useCallback(
    async (data: DemographicData) => {
      try {
        if (isSubmitting || loading.saving) return;

        setIsSubmitting(true);

        const userId = user?.id;
        const teamId = selectedTeam?.id || localStorage.getItem("teamId");

        if (!userId || !teamId) {
          throw new Error(
            "Por favor, aguarde enquanto carregamos suas informações ou faça login novamente."
          );
        }

        const formattedData = {
          ...data,
          employee_count:
            typeof data.employee_count === "string"
              ? parseInt(data.employee_count, 10) || 0
              : data.employee_count || 0,
        };

        const success = await saveDemographicData(formattedData);

        if (success) {
          toast.success("Seu perfil foi salvo com sucesso!");

          router.push("/survey");
        } else {
          throw new Error(
            "Não foi possível salvar o perfil. Por favor, tente novamente."
          );
        }
      } catch (error: any) {
        toast.error(error.message || "Ocorreu um erro ao salvar seu perfil.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.id, selectedTeam?.id, isSubmitting, loading.saving]
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-3xl">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Perfil do Participante
          </h1>
          <p className="text-muted-foreground">
            Por favor, preencha as informações abaixo para começar a pesquisa.
            Suas respostas são confidenciais e serão usadas apenas para fins
            acadêmicos.
          </p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6">
          <DemographicForm onSubmit={handleSubmit} />
        </div>

        <div className="bg-secondary/10 rounded-lg p-6">
          <PrivacyNotice />
        </div>
      </div>
    </Layout>
  );
}
