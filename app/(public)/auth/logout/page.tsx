"use client";

import { useAuth } from "@/resources/auth/auth-hook";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoutPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut();
        // Aguardar um momento para garantir que a sessão seja limpa
        await new Promise((resolve) => setTimeout(resolve, 500));
        window.location.href = "/";
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        window.location.href = "/";
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
