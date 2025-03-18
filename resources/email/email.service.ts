'use server';

import { Resend } from 'resend';
import { InviteEmailTemplate } from '@/components/email-template';
import { EmailTemplateProps } from './email-model';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

/**
 * Gera uma mensagem de convite padrão
 */
export async function generateInviteMessage(teamName: string, fromEmail: string): Promise<string> {
  return `Olá! Estou convidando você para participar da equipe "${teamName}" no Radar21 - uma plataforma para avaliação de competências de liderança na era da Indústria 4.0. Sua participação é muito importante para entendermos o perfil de nossa equipe. Por favor, aceite o convite e responda o questionário. Obrigado! - ${fromEmail}`;
}

/**
 * Envia um email de convite para um usuário
 */
export async function sendInviteEmail(params: EmailTemplateProps): Promise<void> {
  try {
    await resend.emails.send({
      from: 'Radar21 <noreply@radar21.com.br>',
      to: params.to,
      subject: `Convite para participar da equipe ${params.teamName} no Radar21`,
      react: InviteEmailTemplate({
        inviteUrl: params.inviteUrl,
        message: params.message
      })
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Falha ao enviar email de convite');
  }
}

/**
 * Verifica o status de um email enviado
 */
export async function checkEmailStatus(emailId: string): Promise<string> {
  try {
    const response = await resend.emails.get(emailId);
    return response.data?.last_event || 'unknown';
  } catch (error: any) {
    console.error('Erro ao verificar status do email:', error);
    throw new Error(`Falha ao verificar status do email: ${error.message}`);
  }
}