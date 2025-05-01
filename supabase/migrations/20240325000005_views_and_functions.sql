-- Views que dependem de todas as tabelas

-- View para visão geral de equipes por organização
CREATE OR REPLACE VIEW "public"."organization_team_overview" AS
SELECT
    t.organization_id,
    t.owner_email AS organization_email,
    t.id AS team_id,
    t.name AS team_name,
    COUNT(DISTINCT tm.id) FILTER (WHERE tm.status = 'answered') AS members_answered,
    t.team_size AS total_members,
    t.created_at AS team_created_at,
    COUNT(DISTINCT CASE WHEN tm.role = 'leader' AND tm.status = 'answered' THEN tm.id END) AS leaders_answered,
    COUNT(DISTINCT CASE WHEN tm.role = 'leader' THEN tm.id END) AS total_leaders,
    CASE WHEN t.team_size > 0 THEN
        ROUND((COUNT(DISTINCT tm.id) FILTER (WHERE tm.status = 'answered')::numeric / t.team_size) * 100)
    ELSE 0 END AS completion_percentage
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id
GROUP BY t.organization_id, t.owner_email, t.id, t.name, t.team_size, t.created_at;

-- View para respostas da pesquisa por equipe (simplificada para evitar redundância com survey_responses)
CREATE OR REPLACE VIEW "public"."team_survey_responses" AS
SELECT 
    sr.team_id,
    t.name AS team_name,
    t.organization_id,
    t.owner_email AS organization_email,
    tm.id AS member_id,
    tm.email AS member_email,
    tm.role AS member_role,
    tm.status AS response_status,
    sr.q1, sr.q2, sr.q3, sr.q4, sr.q5, sr.q6, sr.q7, sr.q8, sr.q9, sr.q10, sr.q11, sr.q12,
    sr.created_at AS response_date,
    sr.updated_at AS updated_at
FROM survey_responses sr
JOIN teams t ON t.id = sr.team_id
JOIN team_members tm ON tm.user_id = sr.user_id AND tm.team_id = sr.team_id;

-- View para respostas de perguntas abertas (simplificada para usar a tabela original)
CREATE OR REPLACE VIEW "public"."organization_open_answers" AS 
SELECT 
    t.organization_id,
    t.owner_email AS organization_email,
    t.id AS team_id,
    t.name AS team_name,
    oqr.user_id,
    tm.email AS member_email,
    tm.role AS member_role,
    oqr.q13 AS leadership_strengths,
    oqr.q14 AS leadership_improvements,
    oqr.created_at AS response_date
FROM open_question_responses oqr
JOIN teams t ON t.id = oqr.team_id
JOIN team_members tm ON tm.user_id = oqr.user_id AND tm.team_id = oqr.team_id
WHERE (oqr.q13 IS NOT NULL OR oqr.q14 IS NOT NULL);

-- View para comparação de competências (simplificada para refletir as tabelas reais)
CREATE OR REPLACE VIEW "public"."competency_comparison" AS
WITH team_data AS (
    SELECT
        sr.team_id,
        tm.role,
        sr.user_id,
        sr.q1, sr.q2, sr.q3, sr.q4, sr.q5, sr.q6, 
        sr.q7, sr.q8, sr.q9, sr.q10, sr.q11, sr.q12
    FROM survey_responses sr
    JOIN team_members tm ON sr.user_id = tm.user_id AND sr.team_id = tm.team_id
    WHERE sr.is_complete = true
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
    COALESCE(ld.team_id, ta.team_id) as team_id,
    'Abertura' as competency,
    COALESCE(ld.q1, 0) as leader_score,
    COALESCE(ta.q1, 0) as team_average,
    COALESCE(COALESCE(ta.q1, 0) - COALESCE(ld.q1, 0), 0) as difference
FROM leader_data ld
FULL OUTER JOIN team_avg ta ON ld.team_id = ta.team_id
WHERE COALESCE(ld.team_id, ta.team_id) IS NOT NULL
UNION ALL
SELECT
    COALESCE(ld.team_id, ta.team_id) as team_id,
    'Agilidade' as competency,
    COALESCE(ld.q2, 0) as leader_score,
    COALESCE(ta.q2, 0) as team_average,
    COALESCE(COALESCE(ta.q2, 0) - COALESCE(ld.q2, 0), 0) as difference
FROM leader_data ld
FULL OUTER JOIN team_avg ta ON ld.team_id = ta.team_id
WHERE COALESCE(ld.team_id, ta.team_id) IS NOT NULL
UNION ALL
SELECT
    COALESCE(ld.team_id, ta.team_id) as team_id,
    'Confiança' as competency,
    COALESCE(ld.q3, 0) as leader_score,
    COALESCE(ta.q3, 0) as team_average,
    COALESCE(COALESCE(ta.q3, 0) - COALESCE(ld.q3, 0), 0) as difference
FROM leader_data ld
FULL OUTER JOIN team_avg ta ON ld.team_id = ta.team_id
WHERE COALESCE(ld.team_id, ta.team_id) IS NOT NULL
UNION ALL
SELECT
    COALESCE(ld.team_id, ta.team_id) as team_id,
    'Empatia' as competency,
    COALESCE(ld.q4, 0) as leader_score,
    COALESCE(ta.q4, 0) as team_average,
    COALESCE(COALESCE(ta.q4, 0) - COALESCE(ld.q4, 0), 0) as difference
FROM leader_data ld
FULL OUTER JOIN team_avg ta ON ld.team_id = ta.team_id
WHERE COALESCE(ld.team_id, ta.team_id) IS NOT NULL
UNION ALL
SELECT
    COALESCE(ld.team_id, ta.team_id) as team_id,
    'Articulação' as competency,
    COALESCE(ld.q5, 0) as leader_score,
    COALESCE(ta.q5, 0) as team_average,
    COALESCE(COALESCE(ta.q5, 0) - COALESCE(ld.q5, 0), 0) as difference
FROM leader_data ld
FULL OUTER JOIN team_avg ta ON ld.team_id = ta.team_id
WHERE COALESCE(ld.team_id, ta.team_id) IS NOT NULL
UNION ALL
SELECT
    COALESCE(ld.team_id, ta.team_id) as team_id,
    'Adaptabilidade' as competency,
    COALESCE(ld.q6, 0) as leader_score,
    COALESCE(ta.q6, 0) as team_average,
    COALESCE(COALESCE(ta.q6, 0) - COALESCE(ld.q6, 0), 0) as difference
FROM leader_data ld
FULL OUTER JOIN team_avg ta ON ld.team_id = ta.team_id
WHERE COALESCE(ld.team_id, ta.team_id) IS NOT NULL
UNION ALL
SELECT
    COALESCE(ld.team_id, ta.team_id) as team_id,
    'Inovação' as competency,
    COALESCE(ld.q7, 0) as leader_score,
    COALESCE(ta.q7, 0) as team_average,
    COALESCE(COALESCE(ta.q7, 0) - COALESCE(ld.q7, 0), 0) as difference
FROM leader_data ld
FULL OUTER JOIN team_avg ta ON ld.team_id = ta.team_id
WHERE COALESCE(ld.team_id, ta.team_id) IS NOT NULL
UNION ALL
SELECT
    COALESCE(ld.team_id, ta.team_id) as team_id,
    'Comunicação' as competency,
    COALESCE(ld.q8, 0) as leader_score,
    COALESCE(ta.q8, 0) as team_average,
    COALESCE(COALESCE(ta.q8, 0) - COALESCE(ld.q8, 0), 0) as difference
FROM leader_data ld
FULL OUTER JOIN team_avg ta ON ld.team_id = ta.team_id
WHERE COALESCE(ld.team_id, ta.team_id) IS NOT NULL
UNION ALL
SELECT
    COALESCE(ld.team_id, ta.team_id) as team_id,
    'Descentralização' as competency,
    COALESCE(ld.q9, 0) as leader_score,
    COALESCE(ta.q9, 0) as team_average,
    COALESCE(COALESCE(ta.q9, 0) - COALESCE(ld.q9, 0), 0) as difference
FROM leader_data ld
FULL OUTER JOIN team_avg ta ON ld.team_id = ta.team_id
WHERE COALESCE(ld.team_id, ta.team_id) IS NOT NULL
UNION ALL
SELECT
    COALESCE(ld.team_id, ta.team_id) as team_id,
    'Auto-organização' as competency,
    COALESCE(ld.q10, 0) as leader_score,
    COALESCE(ta.q10, 0) as team_average,
    COALESCE(COALESCE(ta.q10, 0) - COALESCE(ld.q10, 0), 0) as difference
FROM leader_data ld
FULL OUTER JOIN team_avg ta ON ld.team_id = ta.team_id
WHERE COALESCE(ld.team_id, ta.team_id) IS NOT NULL
UNION ALL
SELECT
    COALESCE(ld.team_id, ta.team_id) as team_id,
    'Colaboração' as competency,
    COALESCE(ld.q11, 0) as leader_score,
    COALESCE(ta.q11, 0) as team_average,
    COALESCE(COALESCE(ta.q11, 0) - COALESCE(ld.q11, 0), 0) as difference
FROM leader_data ld
FULL OUTER JOIN team_avg ta ON ld.team_id = ta.team_id
WHERE COALESCE(ld.team_id, ta.team_id) IS NOT NULL
UNION ALL
SELECT
    COALESCE(ld.team_id, ta.team_id) as team_id,
    'Resiliência' as competency,
    COALESCE(ld.q12, 0) as leader_score,
    COALESCE(ta.q12, 0) as team_average,
    COALESCE(COALESCE(ta.q12, 0) - COALESCE(ld.q12, 0), 0) as difference
FROM leader_data ld
FULL OUTER JOIN team_avg ta ON ld.team_id = ta.team_id
WHERE COALESCE(ld.team_id, ta.team_id) IS NOT NULL;

-- Configurar a view como somente leitura
REVOKE ALL ON "public"."team_survey_responses" FROM PUBLIC;
GRANT SELECT ON "public"."team_survey_responses" TO authenticated;
GRANT SELECT ON "public"."organization_team_overview" TO authenticated;
GRANT SELECT ON "public"."organization_open_answers" TO authenticated;
GRANT SELECT ON "public"."competency_comparison" TO authenticated;

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
      up.email,
      tm.status,
      t.name as team_name
    from team_members tm
    inner join teams t on t.id = tm.team_id
    inner join user_profiles up on up.email = tm.email
    where tm.status = 'invited'
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
          'subject', 'Complete seu cadastro no Radar21',
          'html', format(
            '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1>Complete seu cadastro no Radar21</h1>
              <p>Você foi convidado para participar da equipe %s.</p>
              <p>Complete seu cadastro para começar.</p>
              <a href="%s/members/login" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Completar Cadastro
              </a>
            </div>',
            v_user.team_name,
            current_setting('PUBLIC_APP_URL')
          )
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