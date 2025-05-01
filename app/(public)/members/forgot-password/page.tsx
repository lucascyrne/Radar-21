"use client";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Layout } from "@/components/layout";
import { useAuth } from "@/resources/auth/auth-hook";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ForgotPasswordPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/team-setup");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (email: string) => {
    try {
      // TODO: Implementar recuperação de senha
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
            <h1 className="text-2xl font-bold">Recuperar Senha</h1>
            <p className="mt-2 text-muted-foreground">
              Digite seu email para receber as instruções
            </p>
          </div>
          <ForgotPasswordForm onSubmit={handleSubmit} />
        </div>
      </div>
    </Layout>
  );
}
