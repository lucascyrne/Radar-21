"use client";

import { RegisterForm } from "@/components/auth/register-form";
import { Layout } from "@/components/layout";
import { useAuth } from "@/resources/auth/auth-hook";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OrgRegisterPage() {
  const { isAuthenticated, signUpWithEmail } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated]);

  const handleSubmit = async (data: {
    email: string;
    password: string;
    role: string;
  }) => {
    try {
      // Forçar o role como ORGANIZATION, independentemente do selecionado
      const response = await signUpWithEmail(
        data.email,
        data.password,
        "ORGANIZATION"
      );

      if (response.error) {
        return response.error.message;
      }

      if (response.data.user) {
        // Redirecionar para a página de verificação de email
        router.push("/org-auth/verify-email");
        return undefined;
      }

      return "Erro inesperado ao criar usuário";
    } catch (error: any) {
      console.error("Erro no registro:", error);
      return error.message || "Erro ao registrar usuário";
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Cadastro de Organização</h1>
            <p className="mt-2 text-muted-foreground">
              Crie sua conta de organização no Radar21
            </p>
          </div>
          <RegisterForm
            onSubmit={handleSubmit}
            hideRoleSelection={true}
            predefinedRole="ORGANIZATION"
          />
        </div>
      </div>
    </Layout>
  );
}
