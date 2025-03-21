import { createClient } from '@/lib/supabase/client';
import { InviteData, InviteStatus, TeamMemberData } from './invite-model';
import { Resend } from 'resend';
import { InviteEmailTemplate } from '@/components/email-template';
import { EmailConfig } from '@/resources/email/email-model';

const STORAGE_KEY = 'radar21_pending_invite';
const INVITE_EMAIL_KEY = 'radar21_pending_invite_email';
const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export class InviteService {
  private static getSupabase() {
    return createClient();
  }

  static async sendInvite(data: InviteData) {
    try {
      const supabase = this.getSupabase();
      const { teamId, email, teamName, invitedBy, message } = data;
      
      // Verificar se já existe um convite pendente
      const { data: existingInvite } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('email', email)
        .single();

      if (existingInvite?.status === 'answered') {
        throw new Error('Este usuário já é membro do time');
      }

      // Criar ou atualizar convite
      const { data: invite, error } = await supabase
        .from('team_members')
        .upsert({
          team_id: teamId,
          email: email,
          status: 'invited' as InviteStatus,
          role: 'member',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Gerar URL do convite com email
      const inviteUrl = `${window.location.origin}/auth?invite=${teamId}&email=${encodeURIComponent(email)}`;

      // Enviar email
      await this.sendInviteEmail({
        teamId,
        email,
        teamName,
        invitedBy,
        message,
        inviteUrl
      });

      return invite;
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      throw error;
    }
  }

  static async processInvite(userId: string, email: string): Promise<string | null> {
    try {
      const supabase = this.getSupabase();
      
      // Verificar se existe um convite pendente no storage
      const pendingTeamId = this.getPendingInvite();
      const pendingEmail = this.getPendingInviteEmail();

      // Se não houver convite pendente, retornar sem erro
      if (!pendingTeamId || !pendingEmail) {
        return null;
      }

      // Verificar se o email do usuário corresponde ao do convite
      if (email !== pendingEmail) {
        throw new Error('Este convite foi enviado para outro email');
      }

      // Verificar se o convite existe e corresponde ao email
      const { data: invite } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', pendingTeamId)
        .eq('email', email)
        .single();

      if (!invite) {
        throw new Error('Convite não encontrado');
      }

      if (invite.status === 'answered' && invite.user_id) {
        if (invite.user_id === userId) {
          return pendingTeamId; // Usuário já aceitou o convite
        }
        throw new Error('Este convite já foi aceito por outro usuário');
      }

      // Atualizar membro do time
      const { error: updateError } = await supabase
        .from('team_members')
        .update({
          user_id: userId,
          status: 'pending_survey' as InviteStatus,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', pendingTeamId)
        .eq('email', email);

      if (updateError) throw updateError;

      // Atualizar os metadados do usuário com o teamId
      const { error: userError } = await supabase.auth.updateUser({
        data: {
          team_id: pendingTeamId,
          role: 'member',
          status: 'pending_survey'
        }
      });

      if (userError) throw userError;

      // Emitir evento para atualizar a lista de equipes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('teamUpdate', { detail: { teamId: pendingTeamId } }));
      }

      this.clearPendingInvite();
      return pendingTeamId;
    } catch (error) {
      console.error('Erro ao processar convite:', error);
      throw error;
    }
  }

  private static async sendInviteEmail(data: InviteData) {
    try {
      const emailConfig: EmailConfig = {
        from: 'noreply@radar21.com',
        to: data.email,
        subject: `Convite para participar do time ${data.teamName}`,
        react: InviteEmailTemplate({
          inviteUrl: data.inviteUrl,
          message: data.message,
          teamName: data.teamName
        })
      };

      await resend.emails.send(emailConfig);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  }

  static storePendingInvite(teamId: string, email: string) {
    localStorage.setItem(STORAGE_KEY, teamId);
    localStorage.setItem(INVITE_EMAIL_KEY, email);
  }

  static getPendingInvite(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  }

  static getPendingInviteEmail(): string | null {
    return localStorage.getItem(INVITE_EMAIL_KEY);
  }

  static clearPendingInvite() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INVITE_EMAIL_KEY);
  }
}