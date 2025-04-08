"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Layout } from "@/components/layout"
import { useAuth } from "@/resources/auth/auth-hook"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/resources/auth/auth.service"
import { toast } from "sonner"

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.user_metadata?.name || "",
        email: user.email || ""
      })
    }
  }, [user])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        email: formData.email,
        data: { name: formData.name }
      })

      if (error) throw error

      toast.success("Perfil atualizado", {
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil", {
        description:
          error.message || "Ocorreu um erro ao atualizar suas informações.",
      });
    } finally {
      setIsLoading(false)
    }
  }, [formData, user, toast])

  if (!user) {
    router.push("/auth")
    return null
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
            <CardDescription>
              Atualize suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu.email@exemplo.com"
                />
                <p className="text-sm text-muted-foreground">
                  Ao alterar seu email, você receberá um link de confirmação no novo endereço.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
