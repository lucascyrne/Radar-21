-- 1. Tabelas principais
-- 1.1 Usuários do sistema (extensão da tabela auth.users)
CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" uuid DEFAULT uuid_generate_v4(),
    "email" text NOT NULL,
    "role" text NOT NULL CHECK (role IN ('ORGANIZATION', 'USER')),
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "auth_id" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_profiles_email_key" UNIQUE ("email")
);

-- Função para criar ou atualizar perfil de usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role_value text;
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
    INSERT INTO public.user_profiles (id, email, role, auth_id)
    VALUES (new.id, new.email, user_role_value, new.id)
    RETURNING id INTO profile_id;
  END IF;

  -- Atualizar os metadados do usuário com o ID do perfil
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{profile_id}',
    to_jsonb(profile_id::text)
  )
  WHERE id = new.id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar perfil preliminar
CREATE OR REPLACE FUNCTION public.create_preliminary_profile(
  user_email text,
  user_role text DEFAULT 'USER'
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
  OR id = user_id;  -- Adicionar busca por ID também

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

  -- Se ainda não encontrar, retornar nulo
  RETURN profile_data;
END;
$$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 