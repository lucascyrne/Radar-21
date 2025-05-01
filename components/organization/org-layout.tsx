"use client";

import { useAuth } from "@/resources/auth/auth-hook";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { OrgHeader } from "./org-header";

interface OrgLayoutProps {
  children: ReactNode;
}

export function OrgLayout({ children }: OrgLayoutProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Verificar se o usuário está autenticado e tem a role correta
  useEffect(() => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      router.push("/members/login");
      return;
    }

    if (user.role !== "ORGANIZATION") {
      toast.error("Acesso não autorizado");
      router.push("/dashboard");
      return;
    }
  }, [user]);

  if (!user?.id || user.role !== "ORGANIZATION") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <OrgHeader />
      <main>{children}</main>
    </div>
  );
}
