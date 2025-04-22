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
    CONSTRAINT "teams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 1.3 Membros da equipe
CREATE TABLE "public"."team_members" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "team_id" uuid NOT NULL,
    "user_id" uuid,
    "email" text NOT NULL,
    "role" text NOT NULL CHECK (role IN ('leader', 'member')),
    "status" text NOT NULL CHECK (status IN ('invited', 'active', 'pending_survey', 'answered')),
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "last_reminder_sent" timestamp with time zone,
    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT "unique_team_member_email" UNIQUE (team_id, email)
);

-- Índices para teams
CREATE INDEX IF NOT EXISTS teams_owner_id_idx ON public.teams USING btree (owner_id);
CREATE INDEX IF NOT EXISTS teams_organization_id_idx ON public.teams USING btree (organization_id);
CREATE INDEX IF NOT EXISTS teams_name_owner_email_idx ON public.teams USING btree (name, owner_email);

-- Índices para team_members
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON public.team_members USING btree (team_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS team_members_email_idx ON public.team_members USING btree (email);
CREATE INDEX IF NOT EXISTS idx_team_members_reminders ON team_members (status, last_reminder_sent) 
WHERE status IN ('invited', 'pending_survey');

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
  WHERE auth_id = NEW.owner_id;
  
  IF owner_role = 'ORGANIZATION' THEN
    -- Se o proprietário for uma organização, atualizar o campo organization_id
    NEW.organization_id = NEW.owner_id;
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
  USING (owner_id = auth.uid());
  
CREATE POLICY "teams_member_policy" 
  ON public.teams 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = id AND user_id = auth.uid()
    )
  ); 