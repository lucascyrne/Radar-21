-- supabase/migrations/20250325172835_add_last_reminder_sent.sql
-- Habilitar extensões necessárias
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Criar schema cron se não existir
create schema if not exists cron;

-- Adicionar coluna last_reminder_sent se não existir
alter table team_members 
add column if not exists last_reminder_sent timestamp with time zone;

-- Criar índice para otimizar consultas de lembretes
create index if not exists idx_team_members_reminders 
on team_members (status, last_reminder_sent)
where status in ('invited', 'pending_survey');

-- Função para enviar lembretes
create or replace function send_reminder_emails()
returns void
language plpgsql
security definer
as $$
declare
  v_user record;
  v_response json;
begin
  -- Buscar usuários que precisam de lembretes
  for v_user in (
    select 
      tm.id,
      tm.email,
      tm.status,
      t.name as team_name
    from team_members tm
    inner join teams t on t.id = tm.team_id
    where tm.status in ('invited', 'pending_survey')
    and (
      tm.last_reminder_sent is null 
      or tm.last_reminder_sent < now() - interval '3 days'
    )
  ) loop
    -- Enviar email usando pg_net e Resend API
    select 
      net.http_post(
        url := 'https://api.resend.com/emails',
        headers := jsonb_build_object(
          'Authorization', concat('Bearer ', current_setting('RESEND_API_KEY')),
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'from', 'Radar21 <noreply@radar21.com.br>',
          'to', v_user.email,
          'subject', case 
            when v_user.status = 'invited' then 'Complete seu cadastro no Radar21'
            else 'Complete a pesquisa do Radar21'
          end,
          'html', case 
            when v_user.status = 'invited' then
              format(
                '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1>Complete seu cadastro no Radar21</h1>
                  <p>Você foi convidado para participar da equipe %s.</p>
                  <p>Complete seu cadastro para começar.</p>
                  <a href="%s/auth" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Completar Cadastro
                  </a>
                </div>',
                v_user.team_name,
                current_setting('PUBLIC_APP_URL')
              )
            else
              format(
                '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1>Complete a pesquisa do Radar21</h1>
                  <p>Sua participação na pesquisa da equipe %s está pendente.</p>
                  <p>Complete-a para contribuir com sua equipe.</p>
                  <a href="%s/survey" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Responder Pesquisa
                  </a>
                </div>',
                v_user.team_name,
                current_setting('PUBLIC_APP_URL')
              )
          end
        )
      ) into v_response;

    -- Atualizar timestamp do último lembrete
    update team_members
    set last_reminder_sent = now()
    where id = v_user.id;
    
  end loop;
end;
$$;

-- Agendar execução diária às 10:00 (horário de Brasília)
select cron.schedule(
  'send-daily-reminders',  -- nome do job
  '0 13 * * *',           -- 10:00 BRT = 13:00 UTC
  'select send_reminder_emails();'
);