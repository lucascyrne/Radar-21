import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTeamFormValues, createTeamSchema } from '@/resources/team/team-model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface CreateTeamFormProps {
  userEmail: string | null;
  isSubmitting: boolean;
  onSubmit: (data: CreateTeamFormValues) => Promise<void>;
}

export function CreateTeamForm({ userEmail, isSubmitting, onSubmit }: CreateTeamFormProps) {
  const createTeamForm = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      role: 'leader',
      team_size: 5,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Sobre a equipe</CardTitle>
      </CardHeader>
      <CardContent>
        <FormProvider {...createTeamForm}>
          <form onSubmit={createTeamForm.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da equipe</Label>
              <Input
                id="name"
                placeholder="Ex: Equipe de Desenvolvimento"
                {...createTeamForm.register('name')}
              />
              {createTeamForm.formState.errors.name && (
                <p className="text-sm text-red-500">{createTeamForm.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Meu email</Label>
              <Input
                value={userEmail || ''}
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <Label>Meu papel é de</Label>
              <RadioGroup 
                defaultValue={createTeamForm.getValues('role')}
                onValueChange={(value) => createTeamForm.setValue('role', value as 'leader' | 'member')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="leader" id="leader" />
                  <Label htmlFor="leader">Líder da equipe</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="member" id="member" />
                  <Label htmlFor="member">Colaborador na equipe</Label>
                </div>
              </RadioGroup>
              {createTeamForm.formState.errors.role && (
                <p className="text-sm text-red-500">{createTeamForm.formState.errors.role.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team_size">Número de pessoas na equipe</Label>
              <Input
                id="team_size"
                type="number"
                min="1"
                {...createTeamForm.register('team_size', { valueAsNumber: true })}
              />
              {createTeamForm.formState.errors.team_size && (
                <p className="text-sm text-red-500">{createTeamForm.formState.errors.team_size.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Equipe'}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
} 