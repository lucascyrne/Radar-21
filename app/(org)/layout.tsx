"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useAuth } from "@/resources/auth/auth-hook";
import { Inter } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Estado para controlar a montagem do componente
  const [isMounted, setIsMounted] = useState(false);

  // Efeito para marcar o componente como montado no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Verificar se o usuário tem o papel correto
  useEffect(() => {
    const isAuthPage = pathname?.includes("/org-auth/");

    if (!isLoading) {
      // Se estiver em uma página de autenticação, não redirecionar
      if (isAuthPage) return;

      // Caso contrário, aplicar as regras de redirecionamento
      if (!isAuthenticated || !user) {
        router.push("/org-auth/login");
      } else if (user.role !== "ORGANIZATION") {
        router.push("/org-auth/login");
      }
    }
  }, [user, isLoading, isAuthenticated, pathname]);

  // Mostrar loading apenas para páginas não-auth quando necessário
  if (!isMounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (
    !pathname?.includes("/org-auth/") &&
    (isLoading || !user || user.role !== "ORGANIZATION")
  ) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div
      className={cn("min-h-screen bg-background antialiased", inter.className)}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster position="top-center" />
      </ThemeProvider>
    </div>
  );
}
