-- Relacionamento entre equipes e organizações
CREATE TABLE IF NOT EXISTS "public"."organization_teams" (
    "id" uuid DEFAULT uuid_generate_v4(),
    "organization_id" uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    "team_id" uuid REFERENCES public.teams(id) ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "organization_teams_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organization_teams_org_team_key" UNIQUE ("organization_id", "team_id")
);

-- Índices para organization_teams
CREATE INDEX IF NOT EXISTS idx_org_teams_org_id ON public.organization_teams USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_teams_team_id ON public.organization_teams USING btree (team_id);

-- Configurações de segurança
ALTER TABLE "public"."organization_teams" ENABLE ROW LEVEL SECURITY;

-- Políticas para equipes da organização
CREATE POLICY "Permitir leitura de equipes da organização para membros"
ON "public"."organization_teams"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = public.organization_teams.organization_id
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = public.organization_teams.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Permitir modificação de equipes da organização para admins"
ON "public"."organization_teams"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = public.organization_teams.organization_id
    AND user_id = auth.uid()
    AND role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = public.organization_teams.organization_id
    AND owner_id = auth.uid()
  )
);

-- Atualizar tabela de times para reconhecer que o usuário é a organização
CREATE OR REPLACE FUNCTION public.update_team_owner_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o proprietário tem role ORGANIZATION
  DECLARE
    owner_role public.user_role;
  BEGIN
    SELECT role INTO owner_role
    FROM public.user_profiles
    WHERE id = NEW.owner_id OR auth_id = NEW.owner_id;
    
    IF owner_role = 'ORGANIZATION' THEN
      -- Se o proprietário for uma organização, atualizar o campo organization_id
      NEW.organization_id = NEW.owner_id;
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente o campo organization_id quando uma equipe é criada
DROP TRIGGER IF EXISTS on_team_created ON public.teams;
CREATE TRIGGER on_team_created
  BEFORE INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_owner_info();

-- Criar índice para facilitar a busca de equipes por organização
CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON public.teams USING btree (organization_id);