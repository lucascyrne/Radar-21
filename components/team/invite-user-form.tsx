"use client";

import supabase from "@/lib/supabase/client";
import { useAuth } from "@/resources/auth/auth-hook";
import { useTeam } from "@/resources/team/team-hook";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Schema para validação do formulário
const inviteFormSchema = z.object({
  email: z.string().email("Por favor, forneça um email válido"),
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres"),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface InviteUserFormProps {
  teamId: string;
  teamName: string;
  ownerEmail: string;
  onInviteSent: () => void;
  existingMembers: Array<{
    id: string;
    email: string;
    status: string;
    created_at: string;
  }>;
}

export default function InviteUserForm({
  teamId,
  teamName,
  ownerEmail,
  onInviteSent,
  existingMembers,
}: InviteUserFormProps) {
  const { user } = useAuth();
  const { addTeamMember, loadTeamMembers, teamMembers, generateInviteMessage } =
    useTeam();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendingTo, setResendingTo] = useState<string | null>(null);

  // Configurar formulário com react-hook-form
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      message: "",
    },
  });

  // Atualizar mensagem quando user ou teamName mudarem
  useEffect(() => {
    if (user?.email) {
      form.setValue("message", generateInviteMessage(teamName, user.email));
    }
  }, [user?.email, teamName]);

  // Verificar se o usuário já existe no Supabase
  const checkUserExists = async (email: string) => {
    try {
      // Primeiro verificar se o usuário já é membro da equipe
      const existingMember = teamMembers.find(
        (member) => member.email === email
      );

      if (existingMember) {
        return existingMember.user_id;
      }

      // Se não for membro, verificar se existe no sistema
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error("Erro ao verificar usuário:", error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
      return null;
    }
  };

  // Enviar convite
  const onSubmit = async (data: InviteFormValues) => {
    if (!user || !teamId) {
      toast.error("Informações de usuário ou equipe não disponíveis");
      return;
    }

    console.log("Enviando convite:", {
      email: data.email,
      teamId,
      teamName,
      currentUser: user.email,
    });

    setIsSubmitting(true);

    try {
      // Verificar se o email pertence a uma conta do tipo ORGANIZATION
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("email", data.email)
        .maybeSingle();

      if (!profileError && profileData?.role === "ORGANIZATION") {
        toast.error("Usuário inelegível", {
          description:
            "Contas do tipo Organização não podem ser convidadas como membros de equipes.",
        });
        setIsSubmitting(false);
        return;
      }

      // Verificar se o membro já existe na equipe
      const existingMember = teamMembers.find(
        (member) => member.email === data.email
      );

      if (existingMember) {
        toast.error("Membro já existe", {
          description: "Este email já foi convidado para a equipe.",
        });
        setIsSubmitting(false);
        return;
      }

      // Gerar URL de convite incluindo o email
      // Verificar se estamos no subdomínio da organização
      const isOrgSubdomain = window.location.hostname.startsWith("org.");
      const baseUrl = isOrgSubdomain
        ? window.location.origin.replace("org.", "") // Remover o "org." do domínio
        : window.location.origin;

      const inviteUrl = `${baseUrl}/members?invite=${teamId}&email=${encodeURIComponent(
        data.email
      )}`;

      console.log("Enviando requisição para /api/send-invite com payload:", {
        email: data.email,
        inviteUrl,
        teamId,
        teamName,
      });

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
          teamName,
          invitedBy: user.email || ownerEmail,
        }),
      });

      // Verificar se a resposta não é um JSON válido (erro de API)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Resposta não-JSON recebida:", await response.text());
        throw new Error(
          `Erro no servidor: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();
      console.log("Resposta da API:", responseData);

      if (!response.ok) {
        console.error("Resposta de erro:", responseData);

        // Tratamento especial para erro de política de segurança
        if (
          responseData.error &&
          responseData.error.includes("row-level security policy")
        ) {
          throw new Error(
            "Você não tem permissão para convidar membros para esta equipe. Entre em contato com o administrador."
          );
        }

        throw new Error(
          responseData.message ||
            responseData.details?.message ||
            responseData.details?.hint ||
            responseData.error ||
            "Erro ao enviar convite"
        );
      }

      // Limpar formulário
      form.reset({
        email: "",
        message: generateInviteMessage(teamName, user.email || ""),
      });

      toast.success("Convite enviado", {
        description:
          "O membro foi adicionado à equipe e recebeu um email de convite.",
      });

      // Recarregar membros da equipe para mostrar o novo membro
      await loadTeamMembers(teamId);

      // Chamar callback de sucesso, se fornecido
      onInviteSent();
    } catch (error: any) {
      console.error("Erro ao enviar convite:", error);
      toast.error("Erro ao enviar convite", {
        description:
          error.message ||
          "Ocorreu um erro ao enviar o convite. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para reenviar convite
  const handleResendInvite = async (email: string) => {
    setResendingTo(email);

    try {
      // Gerar URL de convite atualizado
      const isOrgSubdomain = window.location.hostname.startsWith("org.");
      const baseUrl = isOrgSubdomain
        ? window.location.origin.replace("org.", "") // Remover o "org." do domínio
        : window.location.origin;

      const inviteUrl = `${baseUrl}/members?invite=${teamId}&email=${encodeURIComponent(
        email
      )}`;

      // Enviar email de convite novamente
      const response = await fetch("/api/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          teamId,
          teamName,
          invitedBy: user?.email || ownerEmail,
          inviteUrl,
          message: `Olá! Este é um lembrete para participar da equipe "${teamName}" no Radar21, uma plataforma para avaliação de competências de liderança.`,
        }),
      });

      // Verificar se a resposta não é um JSON válido (erro de API)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          `Erro no servidor: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Falha ao reenviar convite");
      }

      // Notificar sucesso
      toast.success("Convite reenviado", {
        description: `Um novo convite foi enviado para ${email}`,
      });

      // Atualizar a data de envio do convite
      await supabase
        .from("team_members")
        .update({ created_at: new Date().toISOString() })
        .eq("team_id", teamId)
        .eq("email", email);

      onInviteSent(); // Atualizar a lista
    } catch (error: any) {
      console.error("Erro ao reenviar convite:", error);
      toast.error("Erro ao reenviar convite", {
        description: error.message || "Ocorreu um erro ao reenviar o convite.",
      });
    } finally {
      setResendingTo(null);
    }
  };

  // Renderizar membros pendentes com opção de reenvio
  const renderPendingMembers = () => {
    const pendingMembers = existingMembers.filter(
      (member) => member.status === "enviado"
    );

    if (pendingMembers.length === 0) return null;

    return (
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Convites pendentes:</h3>
        <div className="space-y-2">
          {pendingMembers.map((member) => {
            // Calcular tempo desde o envio do convite
            const sentDate = new Date(member.created_at);
            const now = new Date();
            const daysSinceInvite = Math.floor(
              (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium">{member.email}</p>
                  <p className="text-xs text-gray-500">
                    Enviado{" "}
                    {daysSinceInvite === 0
                      ? "hoje"
                      : `há ${daysSinceInvite} dia${
                          daysSinceInvite !== 1 ? "s" : ""
                        }`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResendInvite(member.email)}
                  disabled={resendingTo === member.email || daysSinceInvite < 1} // Permitir reenvio apenas após 1 dia
                >
                  {resendingTo === member.email ? "Reenviando..." : "Reenviar"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convidar Membro</CardTitle>
        <CardDescription>
          Envie um convite para um novo membro participar da sua equipe.
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
              {isSubmitting ? "Enviando..." : "Enviar Convite"}
            </Button>
          </form>
        </Form>

        {renderPendingMembers()}
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Os convites expiram após 7 dias se não forem aceitos.
      </CardFooter>
    </Card>
  );
}
