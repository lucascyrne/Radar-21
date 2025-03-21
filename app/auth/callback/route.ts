import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { InviteService } from '@/resources/invite/invite.service';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const invite = requestUrl.searchParams.get('invite');
  const team = requestUrl.searchParams.get('team');
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Erro na troca de código por sessão:', error);
        return NextResponse.redirect(new URL('/auth?error=session_exchange_failed', requestUrl.origin));
      }

      // Se houver convite, armazená-lo
      if (invite) {
        InviteService.storePendingInvite(invite, decodeURIComponent(team || ''));
        
        // Verificar se o usuário já existe
        const { data: userData } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', authData.user?.id)
          .single();

        if (userData?.team_id === invite) {
          // Usuário já está na equipe, redirecionar para a página principal
          return NextResponse.redirect(new URL('/', requestUrl.origin));
        }
      }

      // Redirecionar para a página apropriada
      const redirectUrl = invite 
        ? `/auth?invite=${invite}${team ? `&team=${team}` : ''}`
        : '/';

      return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
    } catch (error) {
      console.error('Erro no processamento do callback:', error);
      return NextResponse.redirect(new URL('/auth?error=callback_processing', requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 