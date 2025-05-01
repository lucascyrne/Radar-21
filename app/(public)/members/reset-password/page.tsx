"use client";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Layout } from "@/components/layout";
import { useAuth } from "@/resources/auth/auth-hook";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ResetPasswordPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/team-setup");
    }
  }, [isAuthenticated]);

  const handleSubmit = async (data: {
    password: string;
    confirmPassword: string;
  }) => {
    try {
      // TODO: Implementar redefinição de senha
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
            <h1 className="text-2xl font-bold">Redefinir Senha</h1>
            <p className="mt-2 text-muted-foreground">Digite sua nova senha</p>
          </div>
          <ResetPasswordForm onSubmit={handleSubmit} />
        </div>
      </div>
    </Layout>
  );
}
