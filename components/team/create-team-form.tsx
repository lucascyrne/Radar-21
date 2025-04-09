import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreateTeamFormValues,
  createTeamSchema,
} from "@/resources/team/team-model";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

interface CreateTeamFormProps {
  userEmail: string | null;
  isSubmitting: boolean;
  onSubmit: (data: CreateTeamFormValues) => Promise<void>;
}

export function CreateTeamForm({
  userEmail,
  isSubmitting,
  onSubmit,
}: CreateTeamFormProps) {
  const createTeamForm = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      role: "leader",
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
          <form
            onSubmit={createTeamForm.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nome da equipe</Label>
              <Input
                id="name"
                placeholder="Ex: Equipe de Desenvolvimento"
                {...createTeamForm.register("name")}
              />
              {createTeamForm.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {createTeamForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Meu email</Label>
              <Input value={userEmail || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_size">Número de pessoas na equipe</Label>
              <Input
                id="team_size"
                type="number"
                min="1"
                {...createTeamForm.register("team_size", {
                  valueAsNumber: true,
                })}
              />
              {createTeamForm.formState.errors.team_size && (
                <p className="text-sm text-red-500">
                  {createTeamForm.formState.errors.team_size.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Equipe"}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
