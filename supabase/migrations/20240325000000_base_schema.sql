-- Habilitar extensões necessárias
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;
create schema if not exists cron;

-- Criar tipo user_role se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.user_role AS ENUM ('ORGANIZATION', 'USER');
    END IF;
END
$$;

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;