"use client";

import supabase from "@/lib/supabase/client";
import React, { useCallback, useState } from "react";
import { InviteContext } from "./invite-context";
import { InviteData, InviteStatus } from "./invite-model";

// Não inicializamos o Resend no cliente, apenas no servidor
// O Resend deve ser usado apenas no lado do servidor (API routes)

const emailDefaults = {
  from: "Radar21 <noreply@radar21.com.br>",
  subject: "Convite para participar da equipe no Radar21",
};

export const InviteProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingInviteId, setPendingInviteId] = useState<string>();

  const handleEmailSend = async (data: InviteData) => {
    try {
      // Este método deve chamar a API em vez de usar o Resend diretamente
      const response = await fetch("/api/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          inviteUrl: data.inviteUrl,
          message: data.message,
          teamId: data.teamId,
          teamName: data.teamName,
          invitedBy: data.invitedBy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar email");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao enviar email";
      throw new Error(errorMessage);
    }
  };

  const updateTeamMemberStatus = async (
    teamId: string,
    email: string,
    status: InviteStatus
  ) => {
    const { error } = await supabase.from("team_members").upsert({
      team_id: teamId,
      email: email,
      status: status,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  };

  const sendInvite = useCallback(async (data: InviteData) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Atualizar status do membro para 'pending'
      await updateTeamMemberStatus(
        data.teamId,
        data.email,
        InviteStatus.PENDING
      );

      // Enviar email
      await handleEmailSend(data);

      // Atualizar status para 'sent'
      await updateTeamMemberStatus(
        data.teamId,
        data.email,
        InviteStatus.PENDING
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao processar convite";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resendInvite = useCallback(async (data: InviteData) => {
    setIsProcessing(true);
    setError(null);

    try {
      await handleEmailSend(data);
      await updateTeamMemberStatus(
        data.teamId,
        data.email,
        InviteStatus.PENDING
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao reenviar convite";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processInvite = useCallback(
    async (userId: string, email: string, teamId: string) => {
      setIsProcessing(true);
      setError(null);

      try {
        const { error } = await supabase
          .from("team_members")
          .update({
            user_id: userId,
            status: InviteStatus.ACCEPTED,
            updated_at: new Date().toISOString(),
          })
          .eq("team_id", teamId)
          .eq("email", email);

        if (error) throw error;

        clearPendingInvite();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao processar convite";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const clearPendingInvite = useCallback(() => {
    setPendingInviteId(undefined);
  }, []);

  return (
    <InviteContext.Provider
      value={{
        isProcessing,
        error,
        pendingInviteId,
        sendInvite,
        resendInvite,
        processInvite,
        clearPendingInvite,
      }}
    >
      {children}
    </InviteContext.Provider>
  );
};
