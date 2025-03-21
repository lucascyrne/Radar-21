import { supabase } from '@/resources/auth/auth.service';
import { InviteData, InviteStatus } from './invite-model';
import { Resend } from 'resend';
import { InviteEmailTemplate } from '@/components/email-template';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export class InviteService {
  private static readonly STORAGE_KEY = 'pendingInvite';

  private static async sendInviteEmail(data: InviteData): Promise<void> {
    try {
      await resend.emails.send({
        from: 'Radar21 <noreply@radar21.com.br>',
        to: data.email,
        subject: `Convite para participar da equipe ${data.teamName} no Radar21`,
        react: InviteEmailTemplate({
          inviteUrl: data.inviteUrl,
          message: data.message,
          teamName: data.teamName
        })
      });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  }

  private static async updateTeamMemberStatus(
    teamId: string, 
    email: string, 
    status: InviteStatus, 
    userId?: string,
    role: 'leader' | 'member' = 'member'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .upsert({
          team_id: teamId,
          email: email,
          user_id: userId,
          status: status,
          role: role,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'team_id,email'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar status do membro:', error);
      throw error;
    }
  }

  static async sendInvite(data: InviteData): Promise<void> {
    try {
      // Gerar URL de convite com nome da equipe
      const encodedTeamName = encodeURIComponent(data.teamName);
      data.inviteUrl = `${window.location.origin}/auth?invite=${data.teamId}&team=${encodedTeamName}`;

      // Verificar se já existe convite pendente
      const { data: existingInvite } = await supabase
        .from('team_members')
        .select('status')
        .eq('team_id', data.teamId)
        .eq('email', data.email)
        .single();

      if (existingInvite?.status === 'accepted') {
        throw new Error('Este usuário já é membro da equipe');
      }

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

      // Verificar se o convite ainda é válido
      const { data: invite } = await supabase
        .from('team_members')
        .select('status, team_id')
        .eq('team_id', pendingInvite.teamId)
        .eq('email', email)
        .single();

      if (!invite || invite.status === 'accepted') {
        this.clearPendingInvite();
        throw new Error('Convite inválido ou já utilizado');
      }

      // Atualizar status do membro
      await this.updateTeamMemberStatus(pendingInvite.teamId, email, 'accepted', userId);
      
      // Atualizar o usuário com o teamId
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: email,
          team_id: pendingInvite.teamId,
          updated_at: new Date().toISOString()
        });

      if (userError) throw userError;
      
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
    const teamName = params.get('team');
    
    if (teamId) {
      this.storePendingInvite(teamId, teamName || undefined);
    }
  }

  static getPendingInvite(): { teamId: string; teamName?: string } | null {
    if (typeof window === 'undefined') return null;
    const inviteData = sessionStorage.getItem(this.STORAGE_KEY);
    return inviteData ? JSON.parse(inviteData) : null;
  }

  static storePendingInvite(teamId: string, teamName?: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify({ teamId, teamName }));
  }

  static clearPendingInvite(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}