-- Views que dependem de todas as tabelas

-- View para visão geral de equipes por organização
CREATE OR REPLACE VIEW "public"."organization_team_overview" AS
SELECT
    t.organization_id,
    up.email AS organization_email,
    t.id AS team_id,
    t.name AS team_name,
    COUNT(DISTINCT tm.id) FILTER (WHERE tm.status = 'answered') AS members_answered,
    COUNT(DISTINCT tm.id) AS total_members,
    t.created_at AS team_created_at,
    COUNT(DISTINCT CASE WHEN tm.role = 'leader' AND tm.status = 'answered' THEN tm.id END) AS leaders_answered,
    COUNT(DISTINCT CASE WHEN tm.role = 'leader' THEN tm.id END) AS total_leaders
FROM teams t
JOIN user_profiles up ON up.auth_id = t.organization_id
LEFT JOIN team_members tm ON tm.team_id = t.id
WHERE t.organization_id IS NOT NULL
GROUP BY t.organization_id, up.email, t.id, t.name, t.created_at;

-- View para respostas de pesquisa por equipe
CREATE OR REPLACE VIEW "public"."team_survey_responses" AS
SELECT 
    t.id AS team_id,
    t.name AS team_name,
    t.organization_id,
    up.email AS organization_email,
    tm.id AS member_id,
    tm.email AS member_email,
    tm.role AS member_role,
    tm.status AS response_status,
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
    sr.created_at AS response_date
FROM teams t
JOIN user_profiles up ON up.auth_id = t.organization_id
JOIN team_members tm ON tm.team_id = t.id
LEFT JOIN survey_responses sr ON sr.user_id = tm.user_id AND sr.team_id = t.id
WHERE t.organization_id IS NOT NULL;

-- View para métricas de organização
CREATE OR REPLACE VIEW "public"."organization_metrics" AS
SELECT
    t.organization_id,
    up.email AS organization_email,
    COUNT(DISTINCT t.id) AS total_teams,
    COUNT(DISTINCT tm.id) AS total_members,
    COUNT(DISTINCT CASE WHEN tm.status = 'answered' THEN tm.id END) AS total_responses,
    COUNT(DISTINCT CASE WHEN tm.role = 'leader' THEN tm.id END) AS total_leaders,
    COUNT(DISTINCT CASE WHEN tm.role = 'leader' AND tm.status = 'answered' THEN tm.id END) AS leaders_responded
FROM teams t
JOIN user_profiles up ON up.auth_id = t.organization_id
LEFT JOIN team_members tm ON tm.team_id = t.id
WHERE t.organization_id IS NOT NULL
GROUP BY t.organization_id, up.email;

-- View para respostas de perguntas abertas por organização
CREATE OR REPLACE VIEW "public"."organization_open_answers" AS 
SELECT 
    t.organization_id,
    up.email AS organization_email,
    t.id AS team_id,
    t.name AS team_name,
    tm.user_id,
    tm.email AS member_email,
    tm.role AS member_role,
    oqr.q13 AS leadership_strengths,
    oqr.q14 AS leadership_improvements,
    oqr.created_at AS response_date
FROM teams t
JOIN user_profiles up ON up.auth_id = t.organization_id
JOIN team_members tm ON tm.team_id = t.id
LEFT JOIN open_question_responses oqr ON oqr.user_id = tm.user_id AND oqr.team_id = t.id
WHERE t.organization_id IS NOT NULL
AND (oqr.q13 IS NOT NULL OR oqr.q14 IS NOT NULL);

-- View para comparação de competências
CREATE OR REPLACE VIEW "public"."competency_comparison" AS
WITH team_data AS (
    SELECT
        team_id,
        member_role AS role,
        q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12
    FROM team_survey_responses
    WHERE response_status = 'answered'
),
leader_data AS (
    SELECT
        team_id,
        COALESCE(AVG(q1::numeric), 0) as q1,
        COALESCE(AVG(q2::numeric), 0) as q2,
        COALESCE(AVG(q3::numeric), 0) as q3,
        COALESCE(AVG(q4::numeric), 0) as q4,
        COALESCE(AVG(q5::numeric), 0) as q5,
        COALESCE(AVG(q6::numeric), 0) as q6,
        COALESCE(AVG(q7::numeric), 0) as q7,
        COALESCE(AVG(q8::numeric), 0) as q8,
        COALESCE(AVG(q9::numeric), 0) as q9,
        COALESCE(AVG(q10::numeric), 0) as q10,
        COALESCE(AVG(q11::numeric), 0) as q11,
        COALESCE(AVG(q12::numeric), 0) as q12
    FROM team_data
    WHERE role = 'leader'
    GROUP BY team_id
),
team_avg AS (
    SELECT
        team_id,
        COALESCE(AVG(q1::numeric), 0) as q1,
        COALESCE(AVG(q2::numeric), 0) as q2,
        COALESCE(AVG(q3::numeric), 0) as q3,
        COALESCE(AVG(q4::numeric), 0) as q4,
        COALESCE(AVG(q5::numeric), 0) as q5,
        COALESCE(AVG(q6::numeric), 0) as q6,
        COALESCE(AVG(q7::numeric), 0) as q7,
        COALESCE(AVG(q8::numeric), 0) as q8,
        COALESCE(AVG(q9::numeric), 0) as q9,
        COALESCE(AVG(q10::numeric), 0) as q10,
        COALESCE(AVG(q11::numeric), 0) as q11,
        COALESCE(AVG(q12::numeric), 0) as q12
    FROM team_data
    WHERE role = 'member'
    GROUP BY team_id
)
SELECT
    ld.team_id,
    'Abertura' as competency,
    ld.q1 as leader_score,
    ta.q1 as team_average,
    (ld.q1 - ta.q1) as difference
FROM leader_data ld
JOIN team_avg ta ON ld.team_id = ta.team_id
UNION ALL
SELECT
    ld.team_id,
    'Agilidade' as competency,
    ld.q2 as leader_score,
    ta.q2 as team_average,
    (ld.q2 - ta.q2) as difference
FROM leader_data ld
JOIN team_avg ta ON ld.team_id = ta.team_id
UNION ALL
SELECT
    ld.team_id,
    'Confiança' as competency,
    ld.q3 as leader_score,
    ta.q3 as team_average,
    (ld.q3 - ta.q3) as difference
FROM leader_data ld
JOIN team_avg ta ON ld.team_id = ta.team_id
UNION ALL
SELECT
    ld.team_id,
    'Empatia' as competency,
    ld.q4 as leader_score,
    ta.q4 as team_average,
    (ld.q4 - ta.q4) as difference
FROM leader_data ld
JOIN team_avg ta ON ld.team_id = ta.team_id
UNION ALL
SELECT
    ld.team_id,
    'Articulação' as competency,
    ld.q5 as leader_score,
    ta.q5 as team_average,
    (ld.q5 - ta.q5) as difference
FROM leader_data ld
JOIN team_avg ta ON ld.team_id = ta.team_id
UNION ALL
SELECT
    ld.team_id,
    'Adaptabilidade' as competency,
    ld.q6 as leader_score,
    ta.q6 as team_average,
    (ld.q6 - ta.q6) as difference
FROM leader_data ld
JOIN team_avg ta ON ld.team_id = ta.team_id
UNION ALL
SELECT
    ld.team_id,
    'Inovação' as competency,
    ld.q7 as leader_score,
    ta.q7 as team_average,
    (ld.q7 - ta.q7) as difference
FROM leader_data ld
JOIN team_avg ta ON ld.team_id = ta.team_id
UNION ALL
SELECT
    ld.team_id,
    'Comunicação' as competency,
    ld.q8 as leader_score,
    ta.q8 as team_average,
    (ld.q8 - ta.q8) as difference
FROM leader_data ld
JOIN team_avg ta ON ld.team_id = ta.team_id
UNION ALL
SELECT
    ld.team_id,
    'Descentralização' as competency,
    ld.q9 as leader_score,
    ta.q9 as team_average,
    (ld.q9 - ta.q9) as difference
FROM leader_data ld
JOIN team_avg ta ON ld.team_id = ta.team_id
UNION ALL
SELECT
    ld.team_id,
    'Auto-organização' as competency,
    ld.q10 as leader_score,
    ta.q10 as team_average,
    (ld.q10 - ta.q10) as difference
FROM leader_data ld
JOIN team_avg ta ON ld.team_id = ta.team_id
UNION ALL
SELECT
    ld.team_id,
    'Colaboração' as competency,
    ld.q11 as leader_score,
    ta.q11 as team_average,
    (ld.q11 - ta.q11) as difference
FROM leader_data ld
JOIN team_avg ta ON ld.team_id = ta.team_id
UNION ALL
SELECT
    ld.team_id,
    'Resiliência' as competency,
    ld.q12 as leader_score,
    ta.q12 as team_average,
    (ld.q12 - ta.q12) as difference
FROM leader_data ld
JOIN team_avg ta ON ld.team_id = ta.team_id;

-- Configurar a view como somente leitura
REVOKE ALL ON "public"."team_survey_responses" FROM PUBLIC;
GRANT SELECT ON "public"."team_survey_responses" TO authenticated;
GRANT SELECT ON "public"."organization_team_overview" TO authenticated;
GRANT SELECT ON "public"."organization_open_answers" TO authenticated;
GRANT SELECT ON "public"."competency_comparison" TO authenticated;
GRANT SELECT ON "public"."organization_metrics" TO authenticated;

-- Função para envio de lembretes
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

-- Agendamento do job de lembretes
SELECT cron.schedule(
  'send-daily-reminders',  -- nome do job
  '0 13 * * *',           -- 10:00 BRT = 13:00 UTC
  'select send_reminder_emails();'
); 