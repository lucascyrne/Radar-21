-- 2. Tabelas de equipe
CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" uuid DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "description" text,
    "organization_id" uuid REFERENCES "public"."user_profiles"(id) ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" uuid DEFAULT uuid_generate_v4(),
    "team_id" uuid REFERENCES "public"."teams"(id) ON DELETE CASCADE,
    "user_id" uuid REFERENCES "public"."user_profiles"(id) ON DELETE CASCADE,
    "role" text NOT NULL CHECK (role IN ('LEADER', 'MEMBER')),
    "status" text NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE')) DEFAULT 'PENDING',
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "team_members_team_user_unique" UNIQUE ("team_id", "user_id")
);

-- Função para criar convite de equipe
CREATE OR REPLACE FUNCTION public.create_team_invitation(
    team_id uuid,
    user_email text,
    member_role text DEFAULT 'MEMBER'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile_id uuid;
    team_member_id uuid;
BEGIN
    -- Criar perfil preliminar se necessário
    user_profile_id := public.create_preliminary_profile(user_email);

    -- Criar ou atualizar membro da equipe
    INSERT INTO public.team_members (team_id, user_id, role, status)
    VALUES (team_id, user_profile_id, member_role, 'PENDING')
    ON CONFLICT (team_id, user_id) 
    DO UPDATE SET
        role = EXCLUDED.role,
        status = 'PENDING',
        updated_at = now()
    RETURNING id INTO team_member_id;

    RETURN team_member_id;
END;
$$;

-- Função para aceitar convite de equipe
CREATE OR REPLACE FUNCTION public.accept_team_invitation(
    team_id uuid,
    user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.team_members
    SET 
        status = 'ACTIVE',
        updated_at = now()
    WHERE team_id = team_id 
    AND user_id = user_id
    AND status = 'PENDING';

    RETURN FOUND;
END;
$$;

-- Índices para teams
CREATE INDEX IF NOT EXISTS teams_organization_id_idx ON public.teams USING btree (organization_id);
CREATE INDEX IF NOT EXISTS teams_name_idx ON public.teams USING btree (name);

-- Índices para team_members
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON public.team_members USING btree (team_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members (status);

-- Trigger para atualização de timestamp
CREATE TRIGGER update_team_members_updated_at 
    BEFORE UPDATE ON public.team_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar automaticamente o organization_id quando o owner é uma organização
CREATE OR REPLACE FUNCTION public.update_team_owner_info()
RETURNS TRIGGER AS $$
DECLARE
  owner_role public.user_role;
BEGIN
  -- Verificar se o proprietário tem role ORGANIZATION
  SELECT role INTO owner_role
  FROM public.user_profiles
  WHERE auth_id = NEW.organization_id;
  
  IF owner_role = 'ORGANIZATION' THEN
    -- Se o proprietário for uma organização, atualizar o campo organization_id
    NEW.organization_id = NEW.organization_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente o campo organization_id quando uma equipe é criada
DROP TRIGGER IF EXISTS on_team_created ON public.teams;
CREATE TRIGGER on_team_created
  BEFORE INSERT OR UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_owner_info();

-- Configurações de segurança
ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;

-- Políticas para times
CREATE POLICY "teams_owner_policy" 
  ON public.teams 
  FOR ALL 
  USING (organization_id = auth.uid());
  
CREATE POLICY "teams_member_policy" 
  ON public.teams 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = id AND user_id = auth.uid()
    )
  ); 