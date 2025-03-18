import { supabase } from '@/resources/auth/auth.service';
import { sendInviteEmail } from '../email/email.service';
import { InviteData } from './invite-model';

export class InviteService {
  private static readonly STORAGE_KEYS = {
    teamId: 'pendingInviteTeamId',
    teamName: 'pendingInviteTeamName'
  };

  static async sendInvite(data: InviteData): Promise<void> {
    try {
      // Adicionar membro à equipe com status 'invited'
      const { error: memberError } = await supabase
        .from('team_members')
        .upsert({
          team_id: data.teamId,
          email: data.email,
          role: 'member',
          status: 'invited',
          invited_by: data.invitedBy
        });

      if (memberError) throw memberError;

      // Gerar URL de convite
      const inviteUrl = `${window.location.origin}/auth?invite=${data.teamId}&invite_name=${encodeURIComponent(data.teamName)}`;

      // Enviar email de convite
      await sendInviteEmail({
        to: data.email,
        inviteUrl,
        teamName: data.teamName,
        invitedBy: data.invitedBy,
        message: data.message
      });
    } catch (error) {
      console.error('Erro ao processar convite:', error);
      throw error;
    }
  }

  static async processInvite(userId: string, email: string): Promise<void> {
    const pendingInvite = this.getPendingInvite();
    
    if (pendingInvite.teamId) {
      try {
        // Atualizar status do membro
        const { error } = await supabase
          .from('team_members')
          .update({ 
            user_id: userId,
            status: 'pending_survey' 
          })
          .match({ 
            team_id: pendingInvite.teamId,
            email: email 
          });

        if (error) throw error;
        
        this.clearPendingInvite();
      } catch (error) {
        console.error('Erro ao processar convite pendente:', error);
        throw error;
      }
    }
  }

  static getPendingInvite() {
    const teamId = this.getCookie(this.STORAGE_KEYS.teamId);
    const teamName = this.getCookie(this.STORAGE_KEYS.teamName);
    return { teamId, teamName };
  }

  static storePendingInvite(teamId: string, teamName?: string): void {
    this.setCookie(this.STORAGE_KEYS.teamId, teamId);
    if (teamName) {
      this.setCookie(this.STORAGE_KEYS.teamName, teamName);
    }
  }

  static clearPendingInvite(): void {
    this.deleteCookie(this.STORAGE_KEYS.teamId);
    this.deleteCookie(this.STORAGE_KEYS.teamName);
  }

  private static setCookie(name: string, value: string): void {
    document.cookie = `${name}=${value}; path=/; max-age=3600`;
  }

  private static getCookie(name: string): string | undefined {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')[1];
  }

  private static deleteCookie(name: string): void {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}