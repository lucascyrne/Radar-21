import { supabase } from '@/resources/auth/auth.service';
import { sendInviteEmail } from '../email/email.service';
import { InviteData, PendingInvite } from './invite-model';
import { TeamService } from '../team/team.service';

export class InviteService {
  private static readonly STORAGE_KEY = 'pendingInviteTeamId';

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
      const inviteUrl = `${window.location.origin}/auth?invite=${data.teamId}`;

      // Enviar email de convite
      await sendInviteEmail({
        to: data.email,
        inviteUrl,
        teamName: data.teamName,
        invitedBy: data.invitedBy,
        message: data.message || ''
      });
    } catch (error) {
      console.error('Erro ao processar convite:', error);
      throw error;
    }
  }

  static async processInvite(userId: string, email: string): Promise<string | null> {
    try {
      const pendingInvite = this.getPendingInvite();
      if (!pendingInvite) return null;

      console.log(`Processando convite pendente: teamId=${pendingInvite.teamId}, userId=${userId}, email=${email}`);
      
      // Primeiro, verificar se já existe um registro para este email
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', pendingInvite.teamId)
        .eq('email', email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingMember) {
        // Atualizar o registro existente com o user_id
        const { error: updateError } = await supabase
          .from('team_members')
          .update({
            user_id: userId,
            status: 'invited',
          })
          .eq('id', existingMember.id);

        if (updateError) throw updateError;
      } else {
        // Criar novo registro
        const { error: insertError } = await supabase
          .from('team_members')
          .insert({
            team_id: pendingInvite.teamId,
            user_id: userId,
            email: email,
            role: 'member',
            status: 'invited',
            created_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

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

  static getPendingInvite(): PendingInvite | null {
    if (typeof window === 'undefined') return null;
    const teamId = sessionStorage.getItem(this.STORAGE_KEY);
    return teamId ? { teamId } : null;
  }

  static storePendingInvite(teamId: string): void {
    if (typeof window === 'undefined') return;
    console.log(`Armazenando convite pendente: teamId=${teamId}`);
    sessionStorage.setItem(this.STORAGE_KEY, teamId);
  }

  static clearPendingInvite(): void {
    if (typeof window === 'undefined') return;
    console.log('Limpando convite pendente');
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}