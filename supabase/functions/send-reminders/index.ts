// @ts-ignore Importação direta necessária para Deno
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.0';
// @ts-ignore Importação direta necessária para Deno
import { Resend } from 'https://esm.sh/resend@0.16.0';
// @ts-ignore Importação direta necessária para Deno
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Declaração global para o ambiente Deno
declare global {
  // @ts-ignore Tipo Deno para Edge Functions
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para gerar HTML diretamente sem React
function generateEmailHTML(props: {
  type: 'registration' | 'survey';
  teamName: string;
  message: string;
  actionUrl: string;
}) {
  const { type, teamName, message, actionUrl } = props;
  const title = type === 'registration' ? 'Complete seu cadastro no Radar21' : 'Complete a pesquisa do Radar21';
  const buttonText = type === 'registration' ? 'Completar Cadastro' : 'Responder Pesquisa';

  return {
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563EB; margin-bottom: 10px;">${title}</h1>
          <h2 style="color: #333; font-weight: normal; font-size: 18px;">Equipe: ${teamName}</h2>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <p style="color: #4b5563; line-height: 1.6;">${message}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" 
             style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; 
                    border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
            ${buttonText}
          </a>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
            Este é um email automático. Por favor, não responda a este email.
          </p>
        </div>
      </div>
    `
  };
}

// Função principal que será executada pela Supabase
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('NEXT_PUBLIC_RESEND_API_KEY') ?? '');
    
    // Encontrar usuários que precisam de lembretes
    const cutoffDate = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString();
    
    const { data: users, error } = await supabase
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
      .or(`last_reminder_sent.is.null,last_reminder_sent.lt.${cutoffDate}`);

    if (error) throw error;

    let processed = 0;
    let errors = 0;

    // Processar cada usuário
    for (const user of users || []) {
      try {
        const baseUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://radar21.com.br';
        const type = user.status === 'invited' ? 'registration' : 'survey';
        const actionUrl = `${baseUrl}/${type === 'registration' ? 'auth' : 'survey'}`;
        
        // Obter o nome da equipe
        // @ts-ignore 
        const teamName: string = user.teams?.name || 'Radar21';
        
        const message = type === 'registration'
          ? `Você foi convidado para participar da equipe ${teamName}. Complete seu cadastro para começar.`
          : `Sua participação na pesquisa da equipe ${teamName} está pendente. Complete-a para contribuir com sua equipe.`;

        // Gerar e enviar email
        const { subject, html } = generateEmailHTML({
          type,
          teamName,
          message,
          actionUrl
        });

        await resend.emails.send({
          from: 'Radar21 <noreply@radar21.com.br>',
          to: user.email,
          subject,
          html
        });

        // Atualizar último lembrete enviado
        await supabase
          .from('team_members')
          .update({ last_reminder_sent: new Date().toISOString() })
          .eq('id', user.id);

        processed++;
      } catch (err) {
        console.error(`Erro ao processar lembrete para ${user.email}:`, err);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ processed, errors }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 