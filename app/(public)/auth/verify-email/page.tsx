"use client";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/resources/auth/auth-hook";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VerifyEmailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.email_confirmed_at) {
      router.push("/team-setup");
    }
  }, [user, isLoading]);

  return (
    <Layout>
      <div className="w-full max-w-md mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Verifique seu Email</CardTitle>
            <CardDescription>
              Um link de confirmação foi enviado para seu email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Mail className="h-12 w-12 text-primary" />
              <p className="text-center text-muted-foreground">
                Por favor, verifique sua caixa de entrada e clique no link de
                confirmação para ativar sua conta.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <Button
                variant="outline"
                onClick={() => (window.location.href = "https://gmail.com")}
              >
                Abrir Gmail
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = "https://outlook.live.com")
                }
              >
                Abrir Outlook
              </Button>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Não recebeu o email? Verifique sua pasta de spam ou{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => router.push("/auth")}
              >
                tente novamente
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
