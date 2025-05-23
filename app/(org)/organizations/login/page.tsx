"use client";

import { LoginForm } from "@/components/auth/login-form";
import { Layout } from "@/components/layout";
import { useAuth } from "@/resources/auth/auth-hook";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrgLoginPage() {
  const { signInWithEmail, user, isAuthenticated } = useAuth();
  const [isNonOrgUser, setIsNonOrgUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verificar se há um parâmetro de erro na URL
    const errorParam = searchParams.get("error");
    if (errorParam === "not_organization") {
      setError(
        "Esta área é exclusiva para organizações. Se você é um colaborador ou líder, acesse radar21.com.br"
      );
    }
  }, [searchParams]);

  // Redirecionar se já estiver autenticado como organização
  useEffect(() => {
    if (isAuthenticated && user?.role === "ORGANIZATION") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      setIsNonOrgUser(false);
      const session = await signInWithEmail(data.email, data.password);

      if (!session?.user?.user_metadata?.role) {
        return "Erro ao verificar permissões do usuário";
      }

      // Verificar se NÃO é usuário organização
      if (session.user.user_metadata.role !== "ORGANIZATION") {
        setIsNonOrgUser(true);
        return "Este portal é exclusivo para organizações";
      }

      // Se for organização, redirecionar para o dashboard
      router.push("/dashboard");
      return undefined;
    } catch (error: any) {
      console.error("Erro no login:", error);
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
          <LoginForm onSubmit={handleSubmit} isOrgLogin={true} />
          {isNonOrgUser && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
              <p>Este portal é exclusivo para organizações.</p>
              <p className="mt-1">
                Para acessar como colaborador ou líder, use:
              </p>
              <a
                href="https://radar21.com.br/members/login"
                className="block mt-2 text-blue-600 hover:underline font-medium"
              >
                radar21.com.br/members/login
              </a>
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
