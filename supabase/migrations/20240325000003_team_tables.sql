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

CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" uuid DEFAULT uuid_generate_v4(),
    "team_id" uuid REFERENCES "public"."teams"(id) ON DELETE CASCADE,
    "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE NULL,
    "email" text NOT NULL,
    "role" text NOT NULL CHECK (role IN ('leader', 'member')),
    "status" public.org_invitation_status NOT NULL DEFAULT 'invited',
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "team_members_team_user_unique" UNIQUE ("team_id", "user_id"),
    CONSTRAINT "team_members_team_email_unique" UNIQUE ("team_id", "email")
);

-- Função para associar usuários existentes aos membros de equipe
CREATE OR REPLACE FUNCTION public.sync_team_members_with_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar user_id em team_members onde o email corresponde a um usuário existente
  UPDATE public.team_members tm
  SET user_id = au.id
  FROM auth.users au
  WHERE tm.email = au.email
  AND tm.user_id IS NULL;
END;
$$;

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
    ON CONFLICT (team_id, email) 
    DO UPDATE SET
        role = EXCLUDED.role,
        user_id = COALESCE(EXCLUDED.user_id, public.team_members.user_id),
        status = 'invited',
        updated_at = now()
    RETURNING id INTO team_member_id;

    -- Se o time pertencer a uma organização, sincronizar o membro com a organização
    DECLARE
      org_id uuid;
    BEGIN
      SELECT organization_id INTO org_id
      FROM teams
      WHERE id = team_id AND organization_id IS NOT NULL;

      IF org_id IS NOT NULL AND user_id IS NOT NULL THEN
        PERFORM public.sync_organization_team_members(org_id, team_id);
      END IF;
    END;

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
DECLARE
    user_email text;
    updated_rows int;
BEGIN
    -- Buscar email do usuário
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id;
    
    IF user_email IS NULL THEN
      RETURN FALSE;
    END IF;
    
    -- Atualizar o status do membro e associar o user_id se necessário
    UPDATE public.team_members
    SET 
        status = 'answered',
        user_id = user_id,
        updated_at = now()
    WHERE team_id = team_id 
    AND (user_id = user_id OR email = user_email)
    AND status = 'invited';
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    -- Sincronizar com a organização se o time pertencer a uma
    DECLARE
      org_id uuid;
    BEGIN
      SELECT organization_id INTO org_id
      FROM teams
      WHERE id = team_id AND organization_id IS NOT NULL;

      IF org_id IS NOT NULL THEN
        PERFORM public.sync_organization_team_members(org_id, team_id);
      END IF;
    END;

    RETURN updated_rows > 0;
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

-- Trigger para associar auth.users ao team_members quando um novo usuário é criado
CREATE OR REPLACE FUNCTION public.update_team_members_on_user_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar team_members quando um novo usuário é criado
  UPDATE public.team_members
  SET user_id = NEW.id
  WHERE email = NEW.email
  AND user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_update_team_members ON auth.users;
CREATE TRIGGER on_auth_user_created_update_team_members
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_members_on_user_created(); 