-- Esta migração simplifica o esquema de organização reconhecendo que 
-- um usuário com role ORGANIZATION é a própria organização

-- 1. Primeiro, atualizar a tabela teams para sempre ter o organization_id igual ao owner_id
-- para usuários com role ORGANIZATION
UPDATE teams
SET organization_id = owner_id
FROM public.user_profiles
WHERE teams.owner_id = user_profiles.auth_id
AND user_profiles.role = 'ORGANIZATION';

-- 2. Melhorar a função que atualiza o organization_id automaticamente
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

-- 3. Remover tabelas desnecessárias (mantenha as necessárias para compatibilidade com o código existente)
-- Não removeremos as tabelas, apenas desabilitaremos as restrições para facilitar a migração

-- Remover restrição de chave estrangeira em teams
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_organization_id_fkey;

-- Adicionar nova restrição que reflete a realidade: organization_id é o mesmo que owner_id
-- para usuários com role ORGANIZATION
ALTER TABLE teams ADD CONSTRAINT teams_organization_owner_fkey 
  FOREIGN KEY (organization_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Marque as equipes como pertencentes à organização atual quando o proprietário for uma organização
CREATE OR REPLACE FUNCTION public.mark_team_for_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualize a tabela de times para refletir a nova abordagem
  UPDATE teams 
  SET organization_id = NEW.id
  WHERE owner_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar trigger para marcar equipes como pertencentes à organização quando 
-- um usuário com role ORGANIZATION for atualizado
DROP TRIGGER IF EXISTS on_organization_update ON public.user_profiles;
CREATE TRIGGER on_organization_update
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  WHEN (NEW.role = 'ORGANIZATION')
  EXECUTE FUNCTION public.mark_team_for_organization();

-- 4. Garantir que a tabela teams tenha as permissões corretas
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Adicione políticas para controle de acesso baseado em propriedade
DROP POLICY IF EXISTS "teams_owner_policy" ON public.teams;
CREATE POLICY "teams_owner_policy" 
  ON public.teams 
  FOR ALL 
  USING (owner_id = auth.uid());
  
-- Permitir que usuários vejam equipes às quais pertencem
DROP POLICY IF EXISTS "teams_member_policy" ON public.teams;
CREATE POLICY "teams_member_policy" 
  ON public.teams 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = id AND user_id = auth.uid()
    )
  ); 