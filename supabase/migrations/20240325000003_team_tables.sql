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
    CONSTRAINT "teams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES organizations(id) ON DELETE SET NULL
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