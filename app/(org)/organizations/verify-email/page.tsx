"use client";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-8 space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Verifique seu email</h1>
            <p className="text-muted-foreground">
              Um link de verificação foi enviado para seu email. Por favor,
              verifique sua caixa de entrada e clique no link para ativar sua
              conta.
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <h2 className="text-sm font-medium text-blue-700 mb-1">
              Importante:
            </h2>
            <p className="text-sm text-blue-600">
              Após verificar seu email, você poderá fazer login como uma
              organização e começar a gerenciar suas equipes.
            </p>
          </div>
          <Button asChild className="w-full mt-6">
            <Link href="/organizations/login">Voltar para Login</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
