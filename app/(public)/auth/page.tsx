"use client";

import { Layout } from "@/components/layout";
import { useAuth } from "@/resources/auth/auth-hook";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      // Verificar se é usuário organização
      const isOrg = user?.role === "ORGANIZATION";

      if (isOrg) {
        console.log(
          "Usuário organização autenticado, redirecionando para org.radar21.com.br"
        );
        // Redirecionar para subdomain de organização
        window.location.href = "https://org.radar21.com.br/org/dashboard";
      } else {
        console.log(
          "Usuário comum autenticado, redirecionando para /team-setup"
        );
        router.push("/team-setup");
      }
    }
  }, [isAuthenticated, user]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Bem-vindo ao Radar21</h1>
            <p className="mt-2 text-muted-foreground">
              Escolha como deseja continuar
            </p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Entrar
            </button>
            <button
              onClick={() => router.push("/auth/register")}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Registrar
            </button>
            <a
              href="https://org.radar21.com.br/auth/login"
              className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Área da Organização
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
