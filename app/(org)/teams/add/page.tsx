"use client";

import { OrgLayout } from "@/components/organization/org-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/resources/auth/auth-hook";
import { useTeam } from "@/resources/team/team-hook";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Schema para validação do formulário
const teamFormSchema = z.object({
  name: z.string().min(3, "O nome da equipe deve ter pelo menos 3 caracteres"),
  team_size: z.coerce.number().min(1, "A equipe deve ter pelo menos 1 membro"),
});

type TeamFormValues = z.infer<typeof teamFormSchema>;

export default function AddTeamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createTeam } = useTeam();

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      team_size: 1,
    },
  });

  const onSubmit = useCallback(
    async (data: TeamFormValues) => {
      if (!user?.id || !user?.email) {
        toast.error("Usuário não autenticado", {
          description: "Faça login para continuar",
        });
        return;
      }

      try {
        form.clearErrors();

        // Criar a equipe associada ao usuário atual
        const team = await createTeam(
          {
            name: data.name,
            team_size: data.team_size,
            role: "leader",
            organization_id: user.id, // Usar o ID do usuário como ID da organização
          },
          user.id,
          user.email
        );

        if (!team) {
          throw new Error("Erro ao criar equipe");
        }

        toast.success("Equipe criada com sucesso!", {
          description: "Agora você pode convidar membros para a equipe.",
        });

        // Redirecionar para a página de convite de membros
        router.push(`/teams/${team.id}`);
      } catch (error: any) {
        toast.error("Erro ao criar equipe", {
          description: error.message || "Tente novamente mais tarde",
        });
      }
    },
    [user, form]
  );

  // Se o usuário não estiver autenticado, exibir mensagem
  if (!user) {
    return (
      <OrgLayout>
        <div className="container py-8">
          <Card>
            <CardContent className="flex h-40 flex-col items-center justify-center">
              <p className="mb-4 text-muted-foreground">
                Você precisa estar autenticado para criar uma equipe
              </p>
            </CardContent>
          </Card>
        </div>
      </OrgLayout>
    );
  }

  return (
    <OrgLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Criar Nova Equipe</CardTitle>
            <CardDescription>
              Crie uma nova equipe e convide membros para participar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Equipe</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Equipe de Desenvolvimento"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="team_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho da Equipe</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Criando..." : "Criar Equipe"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </OrgLayout>
  );
}
