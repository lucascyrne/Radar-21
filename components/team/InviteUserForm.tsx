"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/resources/auth/auth-hook';
import { useTeam } from '@/resources/team/team-hook';
import { TeamService } from '@/resources/team/team.service';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Schema para validação do formulário
const inviteFormSchema = z.object({
  email: z.string().email("Por favor, forneça um email válido"),
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres"),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface InviteUserFormProps {
  teamId: string;
  onSuccess?: () => void;
}

export function InviteUserForm({ teamId, onSuccess }: InviteUserFormProps) {
  const { user } = useAuth();
  const { addTeamMember, loadTeamMembers, teamMembers, generateInviteMessage } = useTeam();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configurar formulário com react-hook-form
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      message: user ? generateInviteMessage(teamId, user.email) : "",
    },
  });

  // Verificar se o usuário já existe no Supabase
  const checkUserExists = async (email: string) => {
    try {
      return await TeamService.getUserByEmail(email);
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
      return null;
    }
  };

  // Enviar convite
  const onSubmit = async (data: InviteFormValues) => {
    if (!user || !teamId) {
      toast({
        title: "Erro",
        description: "Informações de usuário ou equipe não disponíveis",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Verificar se o membro já existe na equipe
      const existingMember = teamMembers.find(
        (member) => member.email === data.email
      );

      if (existingMember) {
        toast({
          title: "Membro já existe",
          description: "Este email já foi convidado para a equipe.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Verificar se o usuário já existe no sistema
      const userId = await checkUserExists(data.email);

      // Gerar URL de convite incluindo o email
      const inviteUrl = `${window.location.origin}/auth?invite=${teamId}&email=${encodeURIComponent(data.email)}`;

      // Enviar convite via API
      const response = await fetch("/api/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          inviteUrl,
          message: data.message,
          teamId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Resposta de erro:", errorData);
        throw new Error(errorData.error || "Erro ao enviar convite");
      }

      // Adicionar membro à equipe com status 'invited'
      await addTeamMember(teamId, userId, data.email, "member", "invited");

      // Recarregar membros da equipe para mostrar o novo membro
      await loadTeamMembers(teamId);

      // Limpar formulário
      form.reset({
        email: "",
        message: user ? generateInviteMessage(teamId, user.email) : "",
      });

      toast({
        title: "Convite enviado",
        description: "O membro foi adicionado à equipe e recebeu um email de convite.",
      });

      // Chamar callback de sucesso, se fornecido
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao enviar convite:", error);
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Ocorreu um erro ao enviar o convite. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convidar Membro</CardTitle>
        <CardDescription>
          Envie um convite por email para adicionar novos membros à sua equipe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem personalizada (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escreva uma mensagem personalizada para o convite..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 