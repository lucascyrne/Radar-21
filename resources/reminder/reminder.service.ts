import { createClient } from "@supabase/supabase-js";
import { ReminderUser } from "./reminder-model";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class ReminderService {
  private static readonly REMINDER_INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3 dias em ms

  static async findUsersNeedingReminders(): Promise<ReminderUser[]> {
    const cutoffDate = new Date(
      Date.now() - this.REMINDER_INTERVAL
    ).toISOString();

    const { data, error } = await supabase
      .from("team_members")
      .select(
        `
        id,
        email,
        team_id,
        status,
        last_reminder_sent,
        teams!inner (
          name
        )
      `
      )
      .or(`status.eq.invited,status.eq.pending_survey`)
      .or(`last_reminder_sent.is.null,last_reminder_sent.lt.${cutoffDate}`)
      .returns<ReminderUser[]>();

    if (error) throw error;
    return data || [];
  }

  static async updateLastReminderSent(memberId: string): Promise<void> {
    const { error } = await supabase
      .from("team_members")
      .update({ last_reminder_sent: new Date().toISOString() })
      .eq("id", memberId);

    if (error) throw error;
  }

  static async processReminders(): Promise<{
    processed: number;
    errors: number;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke("send-reminders");

      if (error) throw error;

      return data as { processed: number; errors: number };
    } catch (error) {
      console.error("Erro ao processar lembretes:", error);
      return { processed: 0, errors: 1 };
    }
  }

  static async testReminder(
    email: string,
    type: "registration" | "survey" = "registration"
  ): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke("send-reminders", {
        body: { test: true, email, type },
      });

      if (error) throw error;

      console.log(`Email de teste enviado com sucesso para ${email}`);
    } catch (error) {
      console.error(`Erro ao enviar email de teste para ${email}:`, error);
      throw error;
    }
  }
}
