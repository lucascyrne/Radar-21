-- 1. Criação de tipos e tabelas para organizações
CREATE TYPE public.org_invitation_status AS ENUM ('pending', 'accepted', 'rejected');

-- Tabela de organizações
CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" uuid DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "owner_id" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- Tabela de membros da organização
CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" uuid DEFAULT uuid_generate_v4(),
    "organization_id" uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    "email" text NOT NULL,
    "role" text NOT NULL CHECK (role IN ('admin', 'leader')),
    "status" text NOT NULL CHECK (status IN ('invited', 'active')),
    "last_reminder_sent" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organization_members_org_email_key" UNIQUE ("organization_id", "email")
);

-- Índices para organizations
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations USING btree (owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations USING btree (name);

-- Índices para organization_members
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_email ON public.organization_members USING btree (email);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON public.organization_members USING btree (status) WHERE status = 'active';

-- Triggers para atualização de timestamps
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON public.organizations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at 
    BEFORE UPDATE ON public.organization_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

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
  v_owner_id uuid;
BEGIN
  -- Buscar ID do usuário pelo email
  SELECT id INTO v_owner_id
  FROM auth.users
  WHERE email = owner_email;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com o email fornecido';
  END IF;
  
  -- Criar a organização
  INSERT INTO public.organizations (name, owner_id)
  VALUES (org_name, v_owner_id)
  RETURNING id INTO v_org_id;
  
  -- Adicionar o proprietário como membro admin da organização
  INSERT INTO public.organization_members (
    organization_id, 
    user_id, 
    email, 
    role, 
    status
  )
  VALUES (
    v_org_id, 
    v_owner_id, 
    owner_email, 
    'admin', 
    'active'
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
DECLARE
  v_member_id uuid;
  v_user_id uuid;
BEGIN
  -- Verificar se o email já existe como usuário
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = leader_email;
  
  -- Criar ou atualizar o membro da organização
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    email,
    role,
    status
  )
  VALUES (
    org_id,
    v_user_id,
    leader_email,
    'leader',
    CASE WHEN v_user_id IS NULL THEN 'invited' ELSE 'active' END
  )
  ON CONFLICT (organization_id, email)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    role = EXCLUDED.role,
    status = CASE WHEN EXCLUDED.user_id IS NULL THEN 'invited' ELSE 'active' END,
    updated_at = now()
  RETURNING id INTO v_member_id;
  
  -- Se o usuário não existir, criar um perfil preliminar
  IF v_user_id IS NULL THEN
    PERFORM public.create_preliminary_profile(
      leader_email,
      'LEADER'::public.user_role
    );
  END IF;
  
  RETURN v_member_id;
END;
$$;

-- 4. Políticas de segurança
-- Configurações de segurança para tabelas de organizações
ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;

-- Políticas para organizações
CREATE POLICY "Permitir leitura para membros da organização"
ON "public"."organizations"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = public.organizations.id
    AND user_id = auth.uid()
  )
  OR 
  auth.uid() = public.organizations.owner_id
);

CREATE POLICY "Permitir modificação para o dono da organização"
ON "public"."organizations"
FOR ALL
USING (auth.uid() = public.organizations.owner_id);

-- Políticas para membros da organização
CREATE POLICY "Permitir leitura de membros da organização para membros"
ON "public"."organization_members"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = public.organization_members.organization_id
    AND user_id = auth.uid()
    AND role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = public.organization_members.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Permitir modificação de membros para admins da organização"
ON "public"."organization_members"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = public.organization_members.organization_id
    AND user_id = auth.uid()
    AND role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = public.organization_members.organization_id
    AND owner_id = auth.uid()
  )
); 