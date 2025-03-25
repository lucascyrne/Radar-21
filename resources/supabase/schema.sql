-- Esquema para o banco de dados do Radar21

-- Tabela de equipes
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  team_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice para busca por nome da equipe
  CONSTRAINT teams_name_creator_unique UNIQUE (name, owner_email)
);

-- Tabela de membros da equipe
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('leader', 'member')),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice para busca por email e equipe
  CONSTRAINT team_members_email_team_unique UNIQUE (email, team_id)
);

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE,
  education TEXT,
  graduation_date DATE,
  organization TEXT,
  website TEXT,
  org_type TEXT,
  org_size TEXT,
  employee_count INTEGER,
  city TEXT,
  work_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de respostas do questionário
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  q1 INTEGER CHECK (q1 BETWEEN 1 AND 5),
  q2 INTEGER CHECK (q2 BETWEEN 1 AND 5),
  q3 INTEGER CHECK (q3 BETWEEN 1 AND 5),
  q4 INTEGER CHECK (q4 BETWEEN 1 AND 5),
  q5 INTEGER CHECK (q5 BETWEEN 1 AND 5),
  q6 INTEGER CHECK (q6 BETWEEN 1 AND 5),
  q7 INTEGER CHECK (q7 BETWEEN 1 AND 5),
  q8 INTEGER CHECK (q8 BETWEEN 1 AND 5),
  q9 INTEGER CHECK (q9 BETWEEN 1 AND 5),
  q10 INTEGER CHECK (q10 BETWEEN 1 AND 5),
  q11 INTEGER CHECK (q11 BETWEEN 1 AND 5),
  q12 INTEGER CHECK (q12 BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Cada membro da equipe só pode ter uma resposta
  CONSTRAINT survey_responses_team_member_unique UNIQUE (team_member_id)
);

-- Tabela de respostas para perguntas abertas
CREATE TABLE IF NOT EXISTS open_question_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  q13 TEXT,
  q14 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Cada membro da equipe só pode ter uma resposta
  CONSTRAINT open_question_responses_team_member_unique UNIQUE (team_member_id)
);

-- Função para atualizar o timestamp de atualização
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar o timestamp de atualização
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_responses_updated_at
BEFORE UPDATE ON survey_responses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_open_question_responses_updated_at
BEFORE UPDATE ON open_question_responses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_team_member_id ON user_profiles(team_member_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_team_member_id ON survey_responses(team_member_id);
CREATE INDEX IF NOT EXISTS idx_open_question_responses_team_member_id ON open_question_responses(team_member_id);

-- Atualizar a tabela team_members para incluir campos necessários
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS status text DEFAULT 'invited';
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role text DEFAULT 'member';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_team_id ON team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id); 

-- Migração para atualizar a estrutura da tabela survey_responses
ALTER TABLE survey_responses 
  DROP CONSTRAINT IF EXISTS survey_responses_team_member_id_fkey,
  DROP CONSTRAINT IF EXISTS survey_responses_team_member_unique;

-- Adicionar nova coluna user_id
ALTER TABLE survey_responses 
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar registros existentes
UPDATE survey_responses sr
SET user_id = tm.user_id
FROM team_members tm
WHERE sr.team_member_id = tm.id;

-- Remover coluna antiga
ALTER TABLE survey_responses 
  DROP COLUMN team_member_id;

-- Adicionar nova constraint
ALTER TABLE survey_responses 
  ADD CONSTRAINT survey_responses_user_id_unique UNIQUE (user_id);

-- Migração para atualizar a tabela open_question_responses
ALTER TABLE open_question_responses 
  DROP CONSTRAINT IF EXISTS open_question_responses_team_member_id_fkey,
  DROP CONSTRAINT IF EXISTS open_question_responses_team_member_unique;

-- Adicionar novas colunas
ALTER TABLE open_question_responses 
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

-- Atualizar registros existentes
UPDATE open_question_responses oqr
SET user_id = tm.user_id,
    team_id = tm.team_id
FROM team_members tm
WHERE oqr.team_member_id = tm.id;

-- Remover coluna antiga
ALTER TABLE open_question_responses 
  DROP COLUMN team_member_id;

-- Adicionar novas constraints
ALTER TABLE open_question_responses 
  ADD CONSTRAINT open_question_responses_user_team_unique UNIQUE (user_id, team_id);

-- Adicionar campo team_id à tabela survey_responses
ALTER TABLE survey_responses 
  ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

-- Atualizar registros existentes na tabela survey_responses
UPDATE survey_responses sr
SET team_id = tm.team_id
FROM team_members tm
WHERE sr.user_id = tm.user_id;

-- Adicionar constraint de unicidade para user_id e team_id
ALTER TABLE survey_responses 
  ADD CONSTRAINT survey_responses_user_team_unique UNIQUE (user_id, team_id);

-- Migração para atualizar a tabela user_profiles
ALTER TABLE user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_team_member_id_fkey;

-- Adicionar novas colunas
ALTER TABLE user_profiles 
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

-- Atualizar registros existentes
UPDATE user_profiles up
SET user_id = tm.user_id,
    team_id = tm.team_id
FROM team_members tm
WHERE up.team_member_id = tm.id;

-- Remover coluna antiga
ALTER TABLE user_profiles 
  DROP COLUMN team_member_id;

-- Adicionar nova constraint
ALTER TABLE user_profiles 
  ADD CONSTRAINT user_profiles_user_team_unique UNIQUE (user_id, team_id);

-- Atualizar índices para as novas colunas
DROP INDEX IF EXISTS idx_user_profiles_team_member_id;
DROP INDEX IF EXISTS idx_survey_responses_team_member_id;
DROP INDEX IF EXISTS idx_open_question_responses_team_member_id;

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_team_id ON user_profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_team_id ON survey_responses(team_id);
CREATE INDEX IF NOT EXISTS idx_open_question_responses_user_id ON open_question_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_open_question_responses_team_id ON open_question_responses(team_id);

-- Criar view para facilitar consulta de respostas por equipe
CREATE OR REPLACE VIEW team_survey_responses AS
SELECT 
  tm.id as team_member_id,
  tm.team_id,
  tm.user_id,
  tm.email,
  tm.role,
  tm.status,
  sr.q1,
  sr.q2,
  sr.q3,
  sr.q4,
  sr.q5,
  sr.q6,
  sr.q7,
  sr.q8,
  sr.q9,
  sr.q10,
  sr.q11,
  sr.q12,
  sr.created_at as response_created_at,
  sr.updated_at as response_updated_at
FROM team_members tm
LEFT JOIN survey_responses sr 
  ON sr.user_id = tm.user_id 
  AND sr.team_id = tm.team_id;

-- Migração de correção para remover constraint problemática
BEGIN;

-- Remover a constraint que está causando o erro de duplicação
ALTER TABLE survey_responses 
  DROP CONSTRAINT IF EXISTS survey_responses_user_id_unique;

-- Verificar se a constraint composta existe, se não existir, criar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'survey_responses_user_team_unique'
  ) THEN
    ALTER TABLE survey_responses 
      ADD CONSTRAINT survey_responses_user_team_unique UNIQUE (user_id, team_id);
  END IF;
END $$;

COMMIT;

-- Remover todas as migrações anteriores relacionadas a essas constraints para evitar conflitos
-- (você pode remover as migrações anteriores do arquivo que tentam criar essas constraints)