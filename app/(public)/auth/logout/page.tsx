"use client";

import { useAuth } from "@/resources/auth/auth-hook";
import { useEffect } from "react";

export default function LogoutPage() {
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

        // Redirecionar para a página inicial usando o domínio completo
        const baseUrl = window.location.origin;
        window.location.href = `${baseUrl}/auth/login`;
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        window.location.href = "/auth/login";
      }
    };

    handleLogout();
  }, [signOut]);

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
