-- Desativar RLS em todas as tabelas temporariamente para reconfiguração
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

-- Função para verificar se o usuário é uma organização
CREATE OR REPLACE FUNCTION public.is_organization()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE auth_id = auth.uid() 
    AND role = 'ORGANIZATION'
  );
$$;

-- Função para verificar se o usuário é um usuário comum
CREATE OR REPLACE FUNCTION public.is_regular_user()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE auth_id = auth.uid() 
    AND role = 'USER'
  );
$$;

-- Permissões básicas
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- POLÍTICAS DE ACESSO PARA PROFILES
-- Política para visualizar perfis
CREATE POLICY "user_profiles_select_policy" 
ON public.user_profiles
FOR SELECT
USING (
  auth_id = auth.uid() OR             -- Próprio perfil
  role = 'ORGANIZATION' OR            -- Perfis de organizações são visíveis
  EXISTS (                            -- Perfis das organizações do usuário
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = auth_id
    AND om.user_id = auth.uid()
  )
);

-- Política para atualizar perfis
CREATE POLICY "user_profiles_update_policy" 
ON public.user_profiles
FOR UPDATE
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- POLÍTICAS SIMPLIFICADAS PARA TEAMS
-- Política básica para visualização de equipes
CREATE POLICY "teams_view_policy" 
ON public.teams
FOR SELECT
USING (true);  -- Todos podem visualizar equipes

-- Política para gerenciamento de equipes
CREATE POLICY "teams_manage_policy" 
ON public.teams
FOR ALL
USING (
  organization_id = auth.uid() OR     -- É dono da equipe
  auth.role() = 'service_role'        -- Permissão para funções de serviço
);

-- Política para criação de equipes
CREATE POLICY "teams_insert_policy" 
ON public.teams
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'       -- Qualquer usuário autenticado pode criar equipes
);

-- POLÍTICAS SIMPLIFICADAS PARA TEAM_MEMBERS
-- Política básica para visualização de membros
CREATE POLICY "team_members_view_policy" 
ON public.team_members
FOR SELECT
USING (true);  -- Todos podem visualizar membros de equipes

-- Política para inserção de membros
CREATE POLICY "team_members_insert_policy" 
ON public.team_members
FOR INSERT
WITH CHECK (true);  -- Permitir qualquer inserção

-- Política para atualização de membros
CREATE POLICY "team_members_update_policy" 
ON public.team_members
FOR UPDATE
USING (true);  -- Permitir qualquer atualização

-- Política para deleção de membros
CREATE POLICY "team_members_delete_policy"
ON public.team_members
FOR DELETE
USING (auth.role() = 'authenticated');  -- Manter restrição apenas para deleção

-- POLÍTICAS PARA DEMOGRAPHIC_DATA
CREATE POLICY "demographic_data_policy" 
ON public.demographic_data
FOR ALL
USING (
  user_id = auth.uid() OR             -- Próprio usuário
  EXISTS (                            -- Organização dona da equipe
    SELECT 1 FROM teams t
    WHERE t.id = team_id
    AND t.organization_id = auth.uid()
  ) OR
  auth.role() = 'service_role'        -- Permissão para funções de serviço
)
WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

-- POLÍTICAS PARA SURVEY_RESPONSES
CREATE POLICY "survey_responses_policy" 
ON public.survey_responses
FOR ALL
USING (
  user_id = auth.uid() OR             -- Próprio usuário
  EXISTS (                            -- Organização dona da equipe
    SELECT 1 FROM teams t
    WHERE t.id = team_id
    AND t.organization_id = auth.uid()
  ) OR
  auth.role() = 'service_role'        -- Permissão para funções de serviço
)
WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

-- POLÍTICAS PARA OPEN_QUESTION_RESPONSES
CREATE POLICY "open_question_responses_policy" 
ON public.open_question_responses
FOR ALL
USING (
  user_id = auth.uid() OR             -- Próprio usuário
  EXISTS (                            -- Organização dona da equipe
    SELECT 1 FROM teams t
    WHERE t.id = team_id
    AND t.organization_id = auth.uid()
  ) OR
  auth.role() = 'service_role'        -- Permissão para funções de serviço
)
WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

-- Reativar RLS para todas as tabelas
ALTER TABLE IF EXISTS "public"."teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."demographic_data" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."survey_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."open_question_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."user_profiles" ENABLE ROW LEVEL SECURITY;