-- 2. Tabelas de equipe
CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" uuid DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "description" text,
    "organization_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    "owner_email" text,
    "team_size" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- Criar o tipo enum para status de convite
DROP TYPE IF EXISTS org_invitation_status;
CREATE TYPE org_invitation_status AS ENUM ('invited', 'pending_survey', 'answered');

CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" uuid DEFAULT uuid_generate_v4(),
    "team_id" uuid REFERENCES "public"."teams"(id) ON DELETE CASCADE,
    "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    "email" text NOT NULL,
    "role" text NOT NULL CHECK (role IN ('leader', 'member')),
    "status" org_invitation_status NOT NULL DEFAULT 'invited',
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "team_members_team_user_unique" UNIQUE ("team_id", "user_id"),
    CONSTRAINT "team_members_team_email_unique" UNIQUE ("team_id", "email")
);

-- Função para criar convite de equipe
CREATE OR REPLACE FUNCTION public.create_team_invitation(
    team_id uuid,
    user_email text,
    member_role text DEFAULT 'member'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
    team_member_id uuid;
BEGIN
    -- Buscar ID do usuário se já existir
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = user_email;

    -- Criar ou atualizar membro da equipe
    INSERT INTO public.team_members (team_id, user_id, email, role, status)
    VALUES (team_id, user_id, user_email, member_role, 'invited')
    ON CONFLICT (team_id, user_id) 
    DO UPDATE SET
        role = EXCLUDED.role,
        status = 'invited',
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
        status = 'answered',
        updated_at = now()
    WHERE team_id = team_id 
    AND user_id = user_id
    AND status = 'invited';

    RETURN FOUND;
END;
$$;

-- Índices para teams
CREATE INDEX IF NOT EXISTS teams_organization_id_idx ON public.teams USING btree (organization_id);
CREATE INDEX IF NOT EXISTS teams_name_idx ON public.teams USING btree (name);
CREATE INDEX IF NOT EXISTS teams_owner_email_idx ON public.teams USING btree (owner_email);

-- Índices para team_members
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON public.team_members USING btree (team_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS team_members_email_idx ON public.team_members USING btree (email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members (status);

-- Trigger para atualização de timestamp
CREATE TRIGGER update_team_members_updated_at 
    BEFORE UPDATE ON public.team_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar automaticamente o owner_email quando o owner é uma organização
CREATE OR REPLACE FUNCTION public.update_team_owner_info()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_role public.user_role;
  v_owner_email text;
BEGIN
  -- Verificar se o proprietário tem role ORGANIZATION
  SELECT role, email INTO v_owner_role, v_owner_email
  FROM public.user_profiles
  WHERE auth_id = NEW.organization_id;
  
  IF v_owner_role = 'ORGANIZATION' THEN
    -- Se o proprietário for uma organização, atualizar o owner_email
    NEW.owner_email = v_owner_email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente o owner_email quando uma equipe é criada
DROP TRIGGER IF EXISTS on_team_created ON public.teams;
CREATE TRIGGER on_team_created
  BEFORE INSERT OR UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_owner_info(); 