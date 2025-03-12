import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export class EmailService {
  /**
   * Gera uma mensagem de convite padrão
   * @param teamName Nome da equipe
   * @param fromEmail Email do remetente (líder da equipe)
   * @returns Mensagem de convite formatada
   */
  static generateInviteMessage(teamName: string, fromEmail: string): string {
    return `Olá! Estou convidando você para participar da equipe "${teamName}" no Radar21 - uma plataforma para avaliação de competências de liderança na era da Indústria 4.0. Sua participação é muito importante para entendermos o perfil de nossa equipe. Por favor, aceite o convite e responda o questionário. Obrigado! - ${fromEmail}`;
  }

  /**
   * Verifica o status de um email enviado
   * @param emailId ID do email enviado
   * @returns Status do email
   */
  static async checkEmailStatus(emailId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('status')
        .eq('id', emailId)
        .single();

      if (error) {
        throw new Error(`Erro ao verificar status do email: ${error.message}`);
      }

      return data?.status || 'unknown';
    } catch (error: any) {
      console.error('Erro ao verificar status do email:', error);
      throw new Error(`Falha ao verificar status do email: ${error.message}`);
    }
  }

  /**
   * Registra um log de email enviado
   * @param toEmail Email do destinatário
   * @param fromEmail Email do remetente
   * @param teamName Nome da equipe
   * @param type Tipo de email
   * @param status Status do envio
   * @returns ID do registro de log
   */
  static async logEmailSent(
    toEmail: string,
    fromEmail: string,
    teamName: string,
    type: string = 'invite',
    status: string = 'sent'
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .insert({
          to_email: toEmail,
          from_email: fromEmail,
          team_name: teamName,
          type,
          status,
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Erro ao registrar log de email: ${error.message}`);
      }

      return data?.id;
    } catch (error: any) {
      console.error('Erro ao registrar log de email:', error);
      throw new Error(`Falha ao registrar log de email: ${error.message}`);
    }
  }
} 