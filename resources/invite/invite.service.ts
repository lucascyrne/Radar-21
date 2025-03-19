import { supabase } from '@/resources/auth/auth.service';
import { InviteData, InviteStatus } from './invite-model';
import { Resend } from 'resend';
import { InviteEmailTemplate } from '@/components/email-template';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export class InviteService {
  private static readonly STORAGE_KEY = 'pendingInviteTeamId';

  private static async sendInviteEmail(data: InviteData): Promise<void> {
    try {
      await resend.emails.send({
        from: 'Radar21 <noreply@radar21.com.br>',
        to: data.email,
        subject: `Convite para participar da equipe ${data.teamName} no Radar21`,
        react: InviteEmailTemplate({
          inviteUrl: data.inviteUrl,
          message: data.message
        })
      });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  }

  private static async updateTeamMemberStatus(teamId: string, email: string, status: InviteStatus, userId?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .upsert({
          team_id: teamId,
          email: email,
          user_id: userId,
          status: status,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar status do membro:', error);
      throw error;
    }
  }

  static async sendInvite(data: InviteData): Promise<void> {
    try {
      // Gerar URL de convite
      data.inviteUrl = `${window.location.origin}/auth?invite=${data.teamId}`;

      // Atualizar status do membro para 'pending'
      await this.updateTeamMemberStatus(data.teamId, data.email, 'pending');

      // Enviar email
      await this.sendInviteEmail(data);

      // Atualizar status para 'sent'
      await this.updateTeamMemberStatus(data.teamId, data.email, 'sent');
    } catch (error) {
      console.error('Erro ao processar convite:', error);
      throw error;
    }
  }

  static async processInvite(userId: string, email: string): Promise<string | null> {
    try {
      const pendingInvite = this.getPendingInvite();
      if (!pendingInvite) return null;

      await this.updateTeamMemberStatus(pendingInvite.teamId, email, 'accepted', userId);
      
      this.clearPendingInvite();
      return pendingInvite.teamId;
    } catch (error) {
      console.error('Erro ao processar convite:', error);
      throw error;
    }
  }

  static captureInviteFromUrl(): void {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const teamId = params.get('invite');
    
    if (teamId) {
      console.log('Capturando convite da URL:', teamId);
      this.storePendingInvite(teamId);
    }
  }

  static getPendingInvite(): { teamId: string } | null {
    if (typeof window === 'undefined') return null;
    const teamId = sessionStorage.getItem(this.STORAGE_KEY);
    return teamId ? { teamId } : null;
  }

  static storePendingInvite(teamId: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(this.STORAGE_KEY, teamId);
  }

  static clearPendingInvite(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}