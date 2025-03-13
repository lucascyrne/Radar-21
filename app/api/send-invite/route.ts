import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { InviteEmailTemplate } from '@/components/email-template';
import { EmailService } from '@/resources/email/email.service';
import { supabase } from '@/resources/auth/auth.service';

// Inicializar o cliente Resend com a chave de API
const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Extrair dados do corpo da requisição
    const { email, inviteUrl, message, teamId } = await request.json();
    
    // Validar dados
    if (!email || !inviteUrl || !teamId) {
      return NextResponse.json(
        { error: 'Email, URL de convite e ID da equipe são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Buscar dados da equipe
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('name, owner_email')
      .eq('id', teamId)
      .single();
    
    if (teamError) {
      console.error('Erro ao buscar dados da equipe:', teamError);
      return NextResponse.json(
        { error: `Erro ao buscar dados da equipe: ${teamError.message}` },
        { status: 500 }
      );
    }
    
    // Adicionar o email à URL do convite para preencher automaticamente o formulário
    const inviteUrlWithEmail = `${inviteUrl}&email=${encodeURIComponent(email)}`;
    
    // Enviar email usando o Resend
    const { data, error } = await resend.emails.send({
      from: 'Radar21 <no-reply@radar21.com.br>',
      to: [email],
      subject: `Convite para participar da equipe ${teamData.name} no Radar21`,
      react: InviteEmailTemplate({
        teamName: teamData.name,
        ownerEmail: teamData.owner_email,
        message: message || EmailService.generateInviteMessage(teamData.name, teamData.owner_email),
        inviteUrl: inviteUrlWithEmail,
      }),
    });
    
    if (error) {
      console.error('Erro ao enviar email:', error);
      return NextResponse.json(
        { error: `Erro ao enviar email: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: `Erro ao processar requisição: ${error.message}` },
      { status: 500 }
    );
  }
} 