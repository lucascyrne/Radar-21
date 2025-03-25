import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { ReminderTemplate } from '@/components/email-templates/reminder-template';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

interface ReminderUser {
  id: string;
  email: string;
  team_id: string;
  teams: {
    name: string;
  };
  status: 'invited' | 'pending_survey';
  last_reminder_sent?: string;
}

export class ReminderService {
  private static readonly REMINDER_INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3 dias em ms

  private static async sendEmail(
    email: string, 
    type: 'registration' | 'survey',
    teamName: string
  ) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://radar21.com.br';
    const actionUrl = `${baseUrl}/${type === 'registration' ? 'auth' : 'survey'}`;
    
    const message = type === 'registration'
      ? `Você foi convidado para participar da equipe ${teamName}. Complete seu cadastro para começar.`
      : `Sua participação na pesquisa da equipe ${teamName} está pendente. Complete-a para contribuir com sua equipe.`;

    return await resend.emails.send({
      from: 'Radar21 <noreply@radar21.com.br>',
      to: email,
      subject: type === 'registration' ? 'Complete seu cadastro no Radar21' : 'Complete a pesquisa do Radar21',
      react: ReminderTemplate({
        type,
        teamName,
        message,
        actionUrl
      })
    });
  }

  static async findUsersNeedingReminders(): Promise<ReminderUser[]> {
    const cutoffDate = new Date(Date.now() - this.REMINDER_INTERVAL).toISOString();

    const { data, error } = await supabase
      .from('team_members')
      .select(`
        id,
        email,
        team_id,
        status,
        last_reminder_sent,
        teams!inner (
          name
        )
      `)
      .or(`status.eq.invited,status.eq.pending_survey`)
      .or(`last_reminder_sent.is.null,last_reminder_sent.lt.${cutoffDate}`)
      .returns<ReminderUser[]>();

    if (error) throw error;
    return data || [];
  }

  static async updateLastReminderSent(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ last_reminder_sent: new Date().toISOString() })
      .eq('id', memberId);

    if (error) throw error;
  }

  static async processReminders(): Promise<{
    processed: number;
    errors: number;
  }> {
    let processed = 0;
    let errors = 0;

    const users = await this.findUsersNeedingReminders();

    for (const user of users) {
      try {
        await this.sendEmail(
          user.email,
          user.status === 'invited' ? 'registration' : 'survey',
          user.teams.name
        );
        await this.updateLastReminderSent(user.id);
        processed++;
      } catch (error) {
        console.error(`Erro ao processar lembrete para ${user.email}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  }

  static async testReminder(email: string, type: 'registration' | 'survey' = 'registration'): Promise<void> {
    try {
      await this.sendEmail(
        email,
        type,
        'Equipe de Teste'
      );
      console.log(`Email de teste enviado com sucesso para ${email}`);
    } catch (error) {
      console.error(`Erro ao enviar email de teste para ${email}:`, error);
      throw error;
    }
  }
} 