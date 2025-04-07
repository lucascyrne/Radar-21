-- Habilitar extensões necessárias
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;
create schema if not exists cron;

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Enum para roles do sistema
CREATE TYPE user_role AS ENUM ('COLLABORATOR', 'LEADER', 'ORGANIZATION', 'ADMIN', 'SUPPORT');

-- 1. Tabelas principais
-- 1.1 Usuários do sistema (extensão da tabela auth.users)
CREATE TABLE "public"."user_profiles" (
    "id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "role" user_role NOT NULL DEFAULT 'COLLABORATOR',
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- 1.2 Equipes
CREATE TABLE "public"."teams" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "owner_id" uuid NOT NULL,
    "owner_email" text NOT NULL,
    "team_size" integer NOT NULL DEFAULT 1,
    "organization_id" uuid,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "teams_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT "teams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES user_profiles(id)
);

-- 1.3 Membros da equipe
CREATE TABLE "public"."team_members" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "team_id" uuid NOT NULL,
    "user_id" uuid,
    "email" text NOT NULL,
    "role" user_role NOT NULL DEFAULT 'COLLABORATOR',
    "status" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone,
    "last_reminder_sent" timestamp with time zone,
    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT "team_members_status_check" CHECK (status IN ('invited', 'answered', 'pending_survey')),
    CONSTRAINT "unique_team_member_email" UNIQUE (team_id, email)
);

-- 2. Tabelas da pesquisa
-- 2.1 Dados demográficos (primeiro passo)
CREATE TABLE "public"."demographic_data" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" uuid,
    "team_id" uuid,
    "name" text NOT NULL,
    "birth_date" text,
    "education" text NOT NULL,
    "graduation_university" text,
    "graduation_date" date,
    "employee_count" integer,
    "organization" text NOT NULL,
    "website" text,
    "org_type" text NOT NULL,
    "org_size" text NOT NULL,
    "city" text NOT NULL,
    "work_model" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "demographic_data_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "demographic_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT "demographic_data_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT "demographic_data_user_team_unique" UNIQUE (user_id, team_id)
);

-- 2.2 Respostas do questionário principal
CREATE TABLE "public"."survey_responses" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" uuid,
    "team_id" uuid,
    "q1" integer CHECK ((q1 >= 1) AND (q1 <= 5)),
    "q2" integer CHECK ((q2 >= 1) AND (q2 <= 5)),
    "q3" integer CHECK ((q3 >= 1) AND (q3 <= 5)),
    "q4" integer CHECK ((q4 >= 1) AND (q4 <= 5)),
    "q5" integer CHECK ((q5 >= 1) AND (q5 <= 5)),
    "q6" integer CHECK ((q6 >= 1) AND (q6 <= 5)),
    "q7" integer CHECK ((q7 >= 1) AND (q7 <= 5)),
    "q8" integer CHECK ((q8 >= 1) AND (q8 <= 5)),
    "q9" integer CHECK ((q9 >= 1) AND (q9 <= 5)),
    "q10" integer CHECK ((q10 >= 1) AND (q10 <= 5)),
    "q11" integer CHECK ((q11 >= 1) AND (q11 <= 5)),
    "q12" integer CHECK ((q12 >= 1) AND (q12 <= 5)),
    "is_complete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "survey_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT "survey_responses_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT "survey_responses_user_team_unique" UNIQUE (user_id, team_id)
);

-- 2.3 Respostas das questões abertas
CREATE TABLE "public"."open_question_responses" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" uuid,
    "team_id" uuid,
    "q13" text,
    "q14" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "open_question_responses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "open_question_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT "open_question_responses_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT "open_question_responses_user_team_unique" UNIQUE (user_id, team_id)
);

-- 3. Índices
-- 3.1 Índices para teams
CREATE INDEX teams_owner_id_idx ON public.teams USING btree (owner_id);
CREATE INDEX teams_name_owner_email_idx ON public.teams USING btree (name, owner_email);

-- 3.2 Índices para team_members
CREATE INDEX team_members_team_id_idx ON public.team_members USING btree (team_id);
CREATE INDEX team_members_user_id_idx ON public.team_members USING btree (user_id);
CREATE INDEX team_members_email_idx ON public.team_members USING btree (email);
CREATE INDEX idx_team_members_reminders ON team_members (status, last_reminder_sent) 
WHERE status IN ('invited', 'pending_survey');

-- 3.3 Índices para demographic_data
CREATE INDEX idx_demographic_data_user_id ON public.demographic_data USING btree (user_id);
CREATE INDEX idx_demographic_data_team_id ON public.demographic_data USING btree (team_id);

-- 3.4 Índices para survey_responses
CREATE INDEX idx_survey_responses_user_id ON public.survey_responses USING btree (user_id);
CREATE INDEX idx_survey_responses_team_id ON public.survey_responses USING btree (team_id);

-- 3.5 Índices para open_question_responses
CREATE INDEX idx_open_question_responses_user_id ON public.open_question_responses USING btree (user_id);
CREATE INDEX idx_open_question_responses_team_id ON public.open_question_responses USING btree (team_id);

-- 4. Views
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
    sr.updated_at AS response_updated_at
FROM team_members tm
LEFT JOIN survey_responses sr ON (sr.user_id = tm.user_id AND sr.team_id = tm.team_id);

-- 5. Triggers
CREATE TRIGGER update_demographic_data_updated_at 
    BEFORE UPDATE ON public.demographic_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_responses_updated_at 
    BEFORE UPDATE ON public.survey_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_open_question_responses_updated_at 
    BEFORE UPDATE ON public.open_question_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Função para envio de lembretes
CREATE OR REPLACE FUNCTION send_reminder_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

-- 7. Agendamento do job de lembretes
SELECT cron.schedule(
  'send-daily-reminders',  -- nome do job
  '0 13 * * *',           -- 10:00 BRT = 13:00 UTC
  'select send_reminder_emails();'
);

-- 8. Permissões
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Políticas de segurança baseadas em roles
ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."demographic_data" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."open_question_responses" ENABLE ROW LEVEL SECURITY;

-- Políticas para ADMIN e SUPPORT (acesso total)
CREATE POLICY "full_access_admin_support" ON "public"."teams"
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('ADMIN', 'SUPPORT')
    );

-- Políticas para ORGANIZATION
CREATE POLICY "org_access_teams" ON "public"."teams"
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'ORGANIZATION'
        AND organization_id = auth.uid()
    );

-- Políticas para LEADER e COLLABORATOR
CREATE POLICY "member_read_teams" ON "public"."teams"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_id = teams.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "member_read_survey" ON "public"."survey_responses"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_id = survey_responses.team_id
            AND user_id = auth.uid()
        )
    );

-- Trigger para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (new.id, 'COLLABORATOR');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 