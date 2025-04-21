"use client";

import { LoginForm } from "@/components/auth/login-form";
import { Layout } from "@/components/layout";
import { useAuth } from "@/resources/auth/auth-hook";
import { useState } from "react";
import { toast } from "sonner";

export default function OrgLoginPage() {
  const { signInWithEmail } = useAuth();
  const [isNonOrgUser, setIsNonOrgUser] = useState(false);

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      setIsNonOrgUser(false);
      const session = await signInWithEmail(data.email, data.password);

      // Verificar se NÃO é usuário organização
      if (session.user.user_metadata?.role !== "ORGANIZATION") {
        setIsNonOrgUser(true);
        toast.error("Acesso permitido apenas para organizações");
        return "Este portal é exclusivo para organizações. Colaboradores e líderes devem acessar pelo site principal.";
      }

      return undefined;
    } catch (error: any) {
      toast.error("Erro ao fazer login");
      return error.message;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Portal da Organização</h1>
            <p className="mt-2 text-muted-foreground">
              Acesse sua conta para continuar
            </p>
          </div>
          <LoginForm onSubmit={handleSubmit} />
          {isNonOrgUser && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
              <p>
                Você está tentando acessar com uma conta de{" "}
                <strong>colaborador ou líder</strong>.
              </p>
              <p className="mt-1">
                Por favor, acesse através do portal principal em:
              </p>
              <a
                href="https://radar21.com.br/auth/login"
                className="block mt-2 text-blue-600 hover:underline font-medium"
              >
                radar21.com.br/auth/login
              </a>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
