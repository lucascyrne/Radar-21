-- ATENÇÃO: SOLUÇÃO PARA PROBLEMA DE RECURSÃO INFINITA
-- Primeiro, desativar RLS em todas as tabelas para limpar completamente
ALTER TABLE IF EXISTS "public"."teams" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."team_members" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."demographic_data" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."survey_responses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."open_question_responses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."user_profiles" DISABLE ROW LEVEL SECURITY;

-- Limpar todas as políticas existentes em todas as tabelas
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

-- Criar funções de segurança - abordagem recomendada para evitar recursão
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT role FROM public.user_profiles WHERE id = auth.uid())::text IN ('ADMIN', 'SUPPORT');
$$;

CREATE OR REPLACE FUNCTION public.owns_team(team_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = team_id
    AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(team_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_id
    AND email = public.get_auth_email()
  );
$$;

-- Reativar RLS apenas nas tabelas principais
ALTER TABLE IF EXISTS "public"."teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."demographic_data" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."survey_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."open_question_responses" ENABLE ROW LEVEL SECURITY;

-- Permissões
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_email TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_team TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_team_member TO anon, authenticated, service_role;

-- NOVAS POLÍTICAS SEM RECURSÃO

-- Equipes
CREATE POLICY "teams_insert_policy" ON public.teams
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "teams_select_admin_policy" ON public.teams
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY "teams_select_owner_policy" ON public.teams
    FOR SELECT TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "teams_select_member_policy" ON public.teams
    FOR SELECT TO authenticated
    USING (
      id IN (
        SELECT team_id FROM public.team_members
        WHERE email = public.get_auth_email()
      )
    );

CREATE POLICY "teams_update_admin_policy" ON public.teams
    FOR UPDATE TO authenticated
    USING (public.is_admin());

CREATE POLICY "teams_update_owner_policy" ON public.teams
    FOR UPDATE TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "teams_delete_admin_policy" ON public.teams
    FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "teams_delete_owner_policy" ON public.teams
    FOR DELETE TO authenticated
    USING (owner_id = auth.uid());

-- Membros da equipe
CREATE POLICY "team_members_insert_admin_policy" ON public.team_members
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "team_members_insert_owner_policy" ON public.team_members
    FOR INSERT TO authenticated
    WITH CHECK (public.owns_team(team_id));

CREATE POLICY "team_members_select_admin_policy" ON public.team_members
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY "team_members_select_owner_policy" ON public.team_members
    FOR SELECT TO authenticated
    USING (public.owns_team(team_id));

CREATE POLICY "team_members_select_self_policy" ON public.team_members
    FOR SELECT TO authenticated
    USING (email = public.get_auth_email());

CREATE POLICY "team_members_update_admin_policy" ON public.team_members
    FOR UPDATE TO authenticated
    USING (public.is_admin());

CREATE POLICY "team_members_update_owner_policy" ON public.team_members
    FOR UPDATE TO authenticated
    USING (public.owns_team(team_id));

CREATE POLICY "team_members_delete_admin_policy" ON public.team_members
    FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "team_members_delete_owner_policy" ON public.team_members
    FOR DELETE TO authenticated
    USING (public.owns_team(team_id)); 