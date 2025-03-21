'use client';

import React, { useState, useCallback } from 'react';
import { Resend } from 'resend';
import { InviteEmailTemplate } from '@/components/email-template';
import { InviteContext } from './invite-context';
import { InviteData, InviteStatus } from './invite-model';
import { supabase } from '@/resources/auth/auth.service';
import { EmailConfig } from '../email/email-model';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

const emailDefaults = {
  from: 'Radar21 <noreply@radar21.com.br>',
  subject: 'Convite para participar da equipe no Radar21'
};

export const InviteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingInviteId, setPendingInviteId] = useState<string>();

  const handleEmailSend = async (data: InviteData) => {
    try {
      await resend.emails.send({
        from: emailDefaults.from,
        to: data.email,
        subject: emailDefaults.subject,
        react: InviteEmailTemplate({
          inviteUrl: data.inviteUrl,
          message: data.message,
          teamName: data.teamName
        })
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar email';
      throw new Error(errorMessage);
    }
  };

  const updateTeamMemberStatus = async (teamId: string, email: string, status: InviteStatus) => {
    const { error } = await supabase
      .from('team_members')
      .upsert({
        team_id: teamId,
        email: email,
        status: status,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  };

  const sendInvite = useCallback(async (data: InviteData) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Atualizar status do membro para 'pending'
      await updateTeamMemberStatus(data.teamId, data.email, 'pending_survey');
      
      // Enviar email
      await handleEmailSend(data);
      
      // Atualizar status para 'sent'
      await updateTeamMemberStatus(data.teamId, data.email, 'pending_survey');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar convite';
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
      await updateTeamMemberStatus(data.teamId, data.email, 'pending_survey');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reenviar convite';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processInvite = useCallback(async (userId: string, email: string, teamId: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          user_id: userId,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('email', email);

      if (error) throw error;
      
      clearPendingInvite();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar convite';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

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
        clearPendingInvite
      }}
    >
      {children}
    </InviteContext.Provider>
  );
}; 