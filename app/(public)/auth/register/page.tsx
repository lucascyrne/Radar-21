"use client";

import { RegisterForm } from "@/components/auth/register-form";
import { Layout } from "@/components/layout";
import { useAuth } from "@/resources/auth/auth-hook";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
  const { isAuthenticated, signUpWithEmail } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/team-setup");
    }
  }, [isAuthenticated]);

  const handleSubmit = async (data: {
    email: string;
    password: string;
    role: string;
  }) => {
    try {
      await signUpWithEmail(data.email, data.password, data.role);
      router.push("/auth/verify-email");
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
            <h1 className="text-2xl font-bold">Criar Conta</h1>
            <p className="mt-2 text-muted-foreground">
              Registre-se para começar a usar o Radar21
            </p>
          </div>
          <RegisterForm onSubmit={handleSubmit} />
        </div>
      </div>
    </Layout>
  );
}
