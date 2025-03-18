import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { sendInviteEmail } from '@/resources/email/email.service';
import { supabase } from '@/resources/auth/auth.service';
import { TeamService } from '@/resources/team/team.service';

// Inicializar o cliente Resend com a chave de API
const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, inviteUrl, message, teamId, teamName, invitedBy } = body;
    
    console.log('Recebida solicitação para enviar convite:', { email, teamId });
    
    if (!email || !inviteUrl || !message || !teamId) {
      return NextResponse.json(
        { error: 'Faltam parâmetros obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se o membro já existe na equipe
    const memberExists = await TeamService.checkTeamMemberExists(teamId, email);
    console.log(`Membro existe na equipe? ${memberExists}`);
    
    // Se o membro não existir, adicioná-lo (redundância de segurança)
    if (!memberExists) {
      console.log('Adicionando novo membro à equipe');
      await TeamService.addTeamMember(
        teamId,
        null, // Sem userId ainda
        email,
        'member',
        'invited'
      );
    } else {
      console.log('Membro já existe na equipe, atualizando status para "invited"');
      // Se já existe, garantir que o status esteja como "invited"
      await TeamService.updateMemberStatus(teamId, email, 'invited');
    }
    
    // Enviar o email de convite
    console.log('Enviando email de convite');
    await sendInviteEmail({
      to: email,
      teamName: teamName,
      inviteUrl: inviteUrl,
      message: message,
      invitedBy: invitedBy
    });
    
    console.log('Convite enviado com sucesso');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao processar convite:', error);
    
    return NextResponse.json(
      { error: error.message || 'Erro ao processar convite' },
      { status: 500 }
    );
  }
} 