"use client";

import { useAuth } from "@/resources/auth/auth-hook";
import { useEffect } from "react";

export default function OrgLogoutPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut();
        // Limpar qualquer estado local
        localStorage.clear();
        sessionStorage.clear();

        // Aguardar um momento para garantir que a sessão seja limpa
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Determinar se estamos no subdomínio de organização
        const isOrgSubdomain = window.location.hostname.startsWith("org.");

        // Redirecionar para o login correto com base no domínio
        const baseUrl = window.location.origin;
        if (isOrgSubdomain) {
          window.location.href = `${baseUrl}/organizations/login`;
        } else {
          window.location.href = `/organizations/login`;
        }
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        window.location.href = "/organizations/login";
      }
    };

    handleLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Saindo...</h1>
        <p className="mt-2 text-muted-foreground">
          Você será redirecionado em instantes
        </p>
      </div>
    </div>
  );
}
