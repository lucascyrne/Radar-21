"use client";

import { LoginForm } from "@/components/auth/login-form";
import { Layout } from "@/components/layout";
import { useAuth } from "@/resources/auth/auth-hook";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { signInWithEmail, isAuthenticated, user } = useAuth();
  const [isOrgUser, setIsOrgUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verificar se há um parâmetro de erro na URL
    const errorParam = searchParams.get("error");
    if (errorParam === "org_access_denied") {
      setError(
        "Você precisa estar logado com uma conta de organização para acessar o portal de organização"
      );
    }
  }, [searchParams]);

  // Efeito para redirecionar após login bem-sucedido
  useEffect(() => {
    if (isAuthenticated && user && user.role !== "ORGANIZATION") {
      console.log("Login bem-sucedido. Redirecionando para team-setup...");
      router.push("/team-setup");
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      setIsOrgUser(false);
      const session = await signInWithEmail(data.email, data.password);

      // Verificar se é usuário organização
      if (session.user.user_metadata?.role === "ORGANIZATION") {
        setIsOrgUser(true);
        return "Acesso permitido apenas pela área de organizações em org.radar21.com.br";
      }

      // Redirecionamento será feito pelo useEffect
      console.log("Login bem-sucedido!");
      return undefined;
    } catch (error: any) {
      return error.message;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Entrar</h1>
            <p className="mt-2 text-muted-foreground">
              Acesse sua conta para continuar
            </p>
          </div>
          <LoginForm onSubmit={handleSubmit} />
          {isOrgUser && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
              <p>
                Você está tentando acessar com uma conta de{" "}
                <strong>organização</strong>.
              </p>
              <p className="mt-1">
                Por favor, acesse através do portal de organizações em:
              </p>
              <a
                href="https://org.radar21.com.br/auth/login"
                className="block mt-2 text-blue-600 hover:underline font-medium"
              >
                org.radar21.com.br/auth/login
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
