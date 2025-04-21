"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useAuth } from "@/resources/auth/auth-hook";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Verificar se o usuário tem o papel correto
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push("/org/auth/login");
      } else if (user.role !== "ORGANIZATION") {
        router.push("/org/auth/login");
      }
    }
  }, [user, isLoading, isAuthenticated]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading || !user || user.role !== "ORGANIZATION") {
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
