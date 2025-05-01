-- 1. Criação de tipos e tabelas para organizações
CREATE TYPE public.org_invitation_status AS ENUM ('answered', 'invited', 'pending_survey');

-- Tabela de membros da organização
CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" uuid DEFAULT uuid_generate_v4(),
    "organization_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    "role" text NOT NULL CHECK (role IN ('leader', 'member')),
    "status" org_invitation_status NOT NULL DEFAULT 'invited',
    "last_reminder_sent" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organization_members_org_user_key" UNIQUE ("organization_id", "user_id")
);

-- Índices para organization_members
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON public.organization_members USING btree (status);

-- Triggers para atualização de timestamps
CREATE TRIGGER update_organization_members_updated_at 
    BEFORE UPDATE ON public.organization_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas para membros da organização
ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de membros da organização para membros"
ON "public"."organization_members"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = public.organization_members.organization_id
    AND user_id = auth.uid()
    AND status = 'answered'
  )
  OR organization_id = auth.uid()
  OR user_id = auth.uid()
);

CREATE POLICY "Permitir modificação por líderes"
ON "public"."organization_members"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = public.organization_members.organization_id
    AND user_id = auth.uid()
    AND role = 'leader'
    AND status = 'answered'
  )
  OR organization_id = auth.uid()
);

-- Função para sincronizar membros de times com organização
CREATE OR REPLACE FUNCTION public.sync_organization_team_members(org_id uuid, team_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir membros do time que não estão na organização
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    status
  )
  SELECT 
    org_id,
    tm.user_id,
    tm.role,
    tm.status
  FROM team_members tm
  WHERE tm.team_id = team_id
    AND tm.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = org_id AND om.user_id = tm.user_id
    );
  
  -- Atualizar membros existentes
  UPDATE public.organization_members om
  SET 
    role = CASE 
      WHEN om.role = 'leader' THEN 'leader' -- Manter role leader se já for
      ELSE tm.role -- Caso contrário usar a role do time
    END,
    status = CASE
      WHEN om.status = 'answered' OR tm.status = 'answered' THEN 'answered'
      ELSE tm.status
    END,
    updated_at = now()
  FROM team_members tm
  WHERE om.organization_id = org_id
    AND om.user_id = tm.user_id
    AND tm.team_id = team_id
    AND tm.user_id IS NOT NULL;
END;
$$;

-- Função para convidar um membro para uma organização
CREATE OR REPLACE FUNCTION public.invite_member_to_organization(
  org_id uuid,
  member_email text,
  member_role text DEFAULT 'member'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id uuid;
  v_user_id uuid;
BEGIN
  -- Verificar se o email já existe como usuário
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = member_email;
  
  -- Criar ou atualizar o membro da organização
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    status
  )
  VALUES (
    org_id,
    v_user_id,
    member_role,
    CASE WHEN v_user_id IS NULL THEN 'invited' ELSE 'answered' END
  )
  ON CONFLICT (organization_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    status = CASE WHEN EXCLUDED.user_id IS NULL THEN 'invited' ELSE 'answered' END,
    updated_at = now()
  RETURNING id INTO v_member_id;
  
  -- Se o usuário não existir, criar um perfil preliminar
  IF v_user_id IS NULL THEN
    PERFORM public.create_preliminary_profile(
      member_email,
      'USER'::public.user_role
    );
  END IF;
  
  RETURN v_member_id;
END;
$$;

-- 3. Funções para gerenciamento de organizações
-- Função para criar uma organização
CREATE OR REPLACE FUNCTION public.create_organization(
  org_name text,
  owner_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Buscar ID do usuário pelo email
  SELECT id INTO v_org_id
  FROM auth.users
  WHERE email = owner_email;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com o email fornecido';
  END IF;
  
  -- Adicionar o proprietário como membro admin da organização
  INSERT INTO public.organization_members (
    organization_id, 
    user_id, 
    role, 
    status
  )
  VALUES (
    v_org_id, 
    v_org_id, 
    'leader', 
    'answered'
  );
  
  RETURN v_org_id;
END;
$$;

-- Função para convidar um líder para uma organização
CREATE OR REPLACE FUNCTION public.invite_leader_to_organization(
  org_id uuid,
  leader_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Usar a função genérica com role 'leader'
  RETURN invite_member_to_organization(org_id, leader_email, 'leader');
END;
$$; 