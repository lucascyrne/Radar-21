"use client";

import { OrgHeader } from "@/components/organization/org-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/resources/auth/auth-hook";
import { useState } from "react";
import { toast } from "sonner";

export default function OrgProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({ name });
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <OrgHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
