"use client";

import { LoginForm } from "@/components/auth/login-form";
import { Layout } from "@/components/layout";
import { useAuth } from "@/resources/auth/auth-hook";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { isAuthenticated, signInWithEmail } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/team-setup");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      await signInWithEmail(data.email, data.password);
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
        </div>
      </div>
    </Layout>
  );
}
