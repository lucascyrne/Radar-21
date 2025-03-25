-- Adicionar campo is_complete à tabela survey_responses
ALTER TABLE survey_responses 
  ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE;

-- Atualizar registros existentes baseado na completude das respostas
UPDATE survey_responses 
SET is_complete = (
  q1 IS NOT NULL AND 
  q2 IS NOT NULL AND 
  q3 IS NOT NULL AND 
  q4 IS NOT NULL AND 
  q5 IS NOT NULL AND 
  q6 IS NOT NULL AND 
  q7 IS NOT NULL AND 
  q8 IS NOT NULL AND 
  q9 IS NOT NULL AND 
  q10 IS NOT NULL AND 
  q11 IS NOT NULL AND 
  q12 IS NOT NULL
); 