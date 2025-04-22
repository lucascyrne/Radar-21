-- Desativar RLS em todas as tabelas
ALTER TABLE IF EXISTS "public"."teams" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."team_members" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."demographic_data" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."survey_responses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."open_question_responses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."user_profiles" DISABLE ROW LEVEL SECURITY;

-- Limpar políticas existentes
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename FROM pg_policies 
        WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END$$;

-- Função básica para verificar admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'SUPPORT')
  );
$$;

-- Função para obter email do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    ''
  );
$$;

-- Reativar RLS para todas as tabelas
ALTER TABLE IF EXISTS "public"."demographic_data" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."survey_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."open_question_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."user_profiles" ENABLE ROW LEVEL SECURITY;

-- Permissões básicas
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Política para dados demográficos
CREATE POLICY "demographic_data_policy" ON public.demographic_data
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid() OR
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.email = public.get_auth_email()
            AND tm.team_id = demographic_data.team_id
        )
    )
    WITH CHECK (user_id = auth.uid());

-- Política para respostas da pesquisa
CREATE POLICY "survey_responses_policy" ON public.survey_responses
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid() OR
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.email = public.get_auth_email()
            AND tm.team_id = survey_responses.team_id
            AND tm.status = 'answered'
        )
    )
    WITH CHECK (user_id = auth.uid());

-- Política para respostas abertas
CREATE POLICY "open_question_responses_policy" ON public.open_question_responses
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid() OR
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.email = public.get_auth_email()
            AND tm.team_id = open_question_responses.team_id
            AND tm.status = 'answered'
        )
    )
    WITH CHECK (user_id = auth.uid());

-- Políticas para perfis de usuário
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() OR
        auth_id = auth.uid() OR
        email = public.get_auth_email() OR
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.email = public.get_auth_email()
            AND tm.team_id IN (
                SELECT team_id FROM public.team_members
                WHERE email = user_profiles.email
            )
        )
    );

CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (email = public.get_auth_email());

CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING (
        id = auth.uid() OR
        auth_id = auth.uid() OR
        email = public.get_auth_email() OR
        public.is_admin()
    )
    WITH CHECK (
        id = auth.uid() OR
        auth_id = auth.uid() OR
        email = public.get_auth_email() OR
        public.is_admin()
    );