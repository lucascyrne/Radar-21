-- 4. Views
DROP VIEW IF EXISTS "public"."team_survey_responses";
CREATE OR REPLACE VIEW "public"."team_survey_responses" AS 
SELECT 
    tm.id AS team_member_id,
    tm.team_id,
    tm.user_id,
    tm.email,
    tm.role,
    tm.status,
    sr.q1,
    sr.q2,
    sr.q3,
    sr.q4,
    sr.q5,
    sr.q6,
    sr.q7,
    sr.q8,
    sr.q9,
    sr.q10,
    sr.q11,
    sr.q12,
    sr.created_at AS response_created_at,
    sr.updated_at AS response_updated_at,
    CASE 
        WHEN tm.role = 'leader' THEN true
        ELSE false
    END as is_leader
FROM team_members tm
LEFT JOIN survey_responses sr ON (sr.user_id = tm.user_id AND sr.team_id = tm.team_id)
WHERE tm.status = 'answered';

-- Configurar a view como somente leitura
REVOKE ALL ON "public"."team_survey_responses" FROM PUBLIC;
GRANT SELECT ON "public"."team_survey_responses" TO authenticated;

-- 6. Função para envio de lembretes
CREATE OR REPLACE FUNCTION send_reminder_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_user record;
  v_response json;
begin
  -- Desativar temporariamente RLS para esta função
  SET LOCAL row_security = off;
  
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

-- 7. Agendamento do job de lembretes
SELECT cron.schedule(
  'send-daily-reminders',  -- nome do job
  '0 13 * * *',           -- 10:00 BRT = 13:00 UTC
  'select send_reminder_emails();'
); 