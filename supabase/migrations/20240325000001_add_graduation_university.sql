DO $$ 
BEGIN
    -- Criar a tabela se ela não existir
    CREATE TABLE IF NOT EXISTS public.user_profiles (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        name text NOT NULL,
        birth_date date,
        education text,
        graduation_date date,
        organization text,
        website text,
        org_type text,
        org_size text,
        employee_count integer DEFAULT 0,
        city text,
        work_model text,
        created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
        user_id uuid NOT NULL,
        team_id uuid NOT NULL,
        graduation_university text
    );
    
    -- Adicionar a coluna se ela não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'graduation_university'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN graduation_university text;
    END IF;
END $$;