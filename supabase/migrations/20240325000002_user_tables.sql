-- 1. Tabelas principais
-- 1.1 Usuários do sistema (extensão da tabela auth.users)
CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "email" text NOT NULL,
    "role" public.user_role NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "auth_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_profiles_email_key" UNIQUE ("email"),
    CONSTRAINT "user_profiles_auth_id_key" UNIQUE ("auth_id")
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles USING btree (email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_id ON public.user_profiles USING btree (auth_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles USING btree (role);

-- Função para criar ou atualizar perfil de usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role_value public.user_role;
  profile_id uuid;
BEGIN
  -- Determinar o role com base nos metadados do usuário
  user_role_value := CASE 
    WHEN new.raw_user_meta_data->>'role' = 'ORGANIZATION' THEN 'ORGANIZATION'
    ELSE 'USER'
  END;

  -- Verificar se já existe um perfil com este email
  SELECT id INTO profile_id
  FROM public.user_profiles
  WHERE email = new.email;

  IF profile_id IS NOT NULL THEN
    -- Atualizar o perfil existente com o auth_id
    UPDATE public.user_profiles
    SET 
      auth_id = new.id,
      role = user_role_value,
      updated_at = now()
    WHERE id = profile_id;
  ELSE
    -- Criar novo perfil
    INSERT INTO public.user_profiles (email, role, auth_id)
    VALUES (new.email, user_role_value, new.id)
    RETURNING id INTO profile_id;
  END IF;

  -- Atualizar os metadados do usuário com o ID do perfil e garantir que o role está definido
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{profile_id}',
      to_jsonb(profile_id::text)
    ),
    '{role}',
    to_jsonb(user_role_value::text)
  )
  WHERE id = new.id;

  -- Atualizar a relação entre team_members e o usuário
  UPDATE public.team_members
  SET user_id = new.id
  WHERE email = new.email AND user_id IS NULL;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para associar perfis existentes com auth.users
CREATE OR REPLACE FUNCTION public.sync_user_profiles()
RETURNS void AS $$
DECLARE
  auth_user record;
BEGIN
  FOR auth_user IN (SELECT id, email FROM auth.users WHERE email IS NOT NULL) LOOP
    -- Verificar se já existe um perfil para este email
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = auth_user.email) THEN
      -- Atualizar o auth_id do perfil existente
      UPDATE public.user_profiles
      SET auth_id = auth_user.id
      WHERE email = auth_user.email AND (auth_id IS NULL OR auth_id != auth_user.id);
    ELSE
      -- Criar um novo perfil
      INSERT INTO public.user_profiles (email, role, auth_id)
      VALUES (
        auth_user.email, 
        COALESCE((auth_user.raw_user_meta_data->>'role')::public.user_role, 'USER'), 
        auth_user.id
      )
      ON CONFLICT (email) DO NOTHING;
    END IF;
    
    -- Atualizar team_members para associar user_id
    UPDATE public.team_members
    SET user_id = auth_user.id
    WHERE email = auth_user.email AND user_id IS NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar perfil preliminar
CREATE OR REPLACE FUNCTION public.create_preliminary_profile(
  user_email text,
  user_role public.user_role DEFAULT 'USER'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_id uuid;
BEGIN
  -- Inserir ou atualizar o perfil
  INSERT INTO public.user_profiles (email, role)
  VALUES (user_email, user_role)
  ON CONFLICT (email) 
  DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = now()
  RETURNING id INTO profile_id;

  RETURN profile_id;
END;
$$;

-- Função para buscar perfil de usuário
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data jsonb;
BEGIN
  -- Buscar perfil por auth_id primeiro
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'role', role,
    'auth_id', auth_id,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO profile_data
  FROM public.user_profiles
  WHERE auth_id = user_id
  OR id = user_id;

  -- Se não encontrar, buscar por email usando auth.users
  IF profile_data IS NULL THEN
    SELECT jsonb_build_object(
      'id', up.id,
      'email', up.email,
      'role', up.role,
      'auth_id', up.auth_id,
      'created_at', up.created_at,
      'updated_at', up.updated_at
    ) INTO profile_data
    FROM auth.users au
    JOIN public.user_profiles up ON up.email = au.email
    WHERE au.id = user_id;
  END IF;

  RETURN profile_data;
END;
$$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger para atualizar perfis quando emails são atualizados
CREATE OR REPLACE FUNCTION handle_user_updated()
RETURNS trigger AS $$
BEGIN
  IF NEW.email <> OLD.email THEN
    -- Atualizar email no perfil
    UPDATE public.user_profiles
    SET email = NEW.email, updated_at = now()
    WHERE auth_id = NEW.id;
    
    -- Atualizar email em team_members
    UPDATE public.team_members
    SET email = NEW.email
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email IS DISTINCT FROM OLD.email)
  EXECUTE FUNCTION handle_user_updated(); 