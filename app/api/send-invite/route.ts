import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { InviteEmailTemplate } from '@/components/email-template';
import { supabase } from '@/resources/auth/auth.service';

// Inicializar o cliente Resend com a chave de API
const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, inviteUrl, message, teamId } = await request.json();

    // Validar os dados de entrada
    if (!email || !inviteUrl || !teamId) {
      return NextResponse.json(
        { error: 'Email, URL de convite e ID da equipe são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar informações da equipe
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('name, owner_email')
      .eq('id', teamId)
      .single();

    if (teamError) {
      console.error('Erro ao buscar informações da equipe:', teamError);
      return NextResponse.json(
        { error: 'Erro ao buscar informações da equipe' },
        { status: 500 }
      );
    }

    if (!teamData || !teamData.name || !teamData.owner_email) {
      return NextResponse.json(
        { error: 'Dados da equipe incompletos' },
        { status: 500 }
      );
    }

    // Enviar email usando Resend com o template React
    const { data, error } = await resend.emails.send({
      from: 'Radar21 <onboarding@resend.dev>',
      to: [email],
      subject: `Convite para participar da equipe ${teamData.name} no Radar21`,
      react: InviteEmailTemplate({
        teamName: teamData.name,
        ownerEmail: teamData.owner_email,
        message: message || `Você foi convidado para participar da equipe ${teamData.name} no Radar21.`,
        inviteUrl: inviteUrl
      }),
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      return NextResponse.json(
        { error: 'Falha ao enviar email de convite' },
        { status: 500 }
      );
    }

    // Registrar o envio do email no Supabase (opcional)
    await supabase.from('email_logs').insert({
      to_email: email,
      from_email: teamData.owner_email,
      team_name: teamData.name,
      type: 'invite',
      status: 'sent',
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 