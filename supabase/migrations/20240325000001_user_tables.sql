-- 1. Tabelas principais
-- 1.1 Usuários do sistema (extensão da tabela auth.users)
CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "role" public.user_role NOT NULL DEFAULT 'COLLABORATOR',
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- Trigger para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role_value public.user_role;
BEGIN
  -- Verificar se o usuário já tem um perfil
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = new.id) THEN
    -- Determinar o role com base nos metadados do usuário
    user_role_value := CASE 
      WHEN new.raw_user_meta_data->>'role' = 'ORGANIZATION' THEN 'ORGANIZATION'::public.user_role
      WHEN new.raw_user_meta_data->>'role' = 'LEADER' THEN 'LEADER'::public.user_role
      WHEN new.raw_user_meta_data->>'role' = 'ADMIN' THEN 'ADMIN'::public.user_role
      WHEN new.raw_user_meta_data->>'role' = 'SUPPORT' THEN 'SUPPORT'::public.user_role
      ELSE 'COLLABORATOR'::public.user_role
    END;

    -- Inserir o perfil com o role determinado
    INSERT INTO public.user_profiles (id, role)
    VALUES (new.id, user_role_value);

    -- Log para debug
    RAISE NOTICE 'Novo perfil criado para usuário % com role %', new.id, user_role_value;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 