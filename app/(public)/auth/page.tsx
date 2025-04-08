"use client";

import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/resources/auth/auth-hook";
import { InviteService } from "@/resources/invite/invite.service";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ErrorAlert } from "./components/auth-alerts";
import { LoginForm, RegisterForm } from "./components/auth-forms";

interface LoginFormData {
  email: string;
  password: string;
}

function AuthContent() {
  const { signInWithEmail } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const clearError = () => setError(null);

  // Processar parâmetros de convite
  useEffect(() => {
    const teamId = searchParams.get("teamId");
    const email = searchParams.get("email");

    if (teamId && email) {
      console.log("Armazenando convite pendente:", { teamId, email });
      InviteService.storePendingInvite(teamId, email);
    }
  }, [searchParams]);

  const handleLoginSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      await signInWithEmail(data.email, data.password);

      // O redirecionamento é feito pelo AuthProvider após o login bem-sucedido
    } catch (error: any) {
      console.error("Erro no login:", error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-md mx-auto px-4 py-20">
        <Card>
          <CardHeader>
            <CardTitle>Acesso ao Sistema</CardTitle>
            <CardDescription>
              Faça login ou crie uma conta para acessar a plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorAlert error={error} />

            <Tabs defaultValue="login" onValueChange={() => clearError()}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Registro</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm onSubmit={handleLoginSubmit} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// Componente principal com Suspense
export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
