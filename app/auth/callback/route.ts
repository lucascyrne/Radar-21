import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { InviteService } from '@/resources/invite/invite.service';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const invite = requestUrl.searchParams.get('invite');
  const inviteName = requestUrl.searchParams.get('invite_name');
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        return NextResponse.redirect(new URL('/auth?error=session_exchange_failed', requestUrl.origin));
      }
      
      if (invite) {
        InviteService.storePendingInvite(invite, inviteName || '');
      }
      
      let redirectUrl = '/auth';
      if (invite) {
        redirectUrl += `?invite=${invite}${inviteName ? `&invite_name=${encodeURIComponent(inviteName)}` : ''}`;
      }
      
      return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
    } catch (error) {
      console.error('Erro no processamento do callback:', error);
      return NextResponse.redirect(new URL('/auth?error=callback_processing', requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 