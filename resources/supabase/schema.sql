-- Esquema para o banco de dados do Radar21

-- Tabela de equipes
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  creator_email TEXT NOT NULL,
  team_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice para busca por nome da equipe
  CONSTRAINT teams_name_creator_unique UNIQUE (name, creator_email)
);

-- Tabela de membros da equipe
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('leader', 'member')),
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'cadastrado', 'respondido')),
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
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
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