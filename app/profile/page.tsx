"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Layout } from "@/components/layout"

export default function Profile() {
  const router = useRouter()
  const [profile, setProfile] = useState({
    name: "",
    birthDate: "",
    education: "",
    graduationDate: "",
    organization: "",
    website: "",
    orgType: "",
    orgSize: "",
    employeeCount: "",
  })

  useEffect(() => {
    const teamName = localStorage.getItem("teamName")
    if (!teamName) {
      router.push("/team-setup")
    }

    const savedProfile = localStorage.getItem("userProfile")
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile))
    }
  }, [router])

  const handleChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem("userProfile", JSON.stringify(profile))
    router.push("/survey")
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span className="text-muted-foreground">Minha Equipe</span>
            <span className="font-bold">Meu Perfil</span>
            <span className="text-muted-foreground">Radar das Competências de Liderança 4.0</span>
            <span className="text-muted-foreground">Resultados</span>
          </div>
          <Progress value={50} className="h-2" />
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">Seu Perfil</h1>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={profile.birthDate}
                    onChange={(e) => handleChange("birthDate", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Escolaridade</Label>
                <Select value={profile.education} onValueChange={(value) => handleChange("education", value)}>
                  <SelectTrigger id="education">
                    <SelectValue placeholder="Selecione sua escolaridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2oGrau">2º Grau</SelectItem>
                    <SelectItem value="superiorIncompleto">Superior Incompleto</SelectItem>
                    <SelectItem value="superiorCompleto">Superior Completo</SelectItem>
                    <SelectItem value="posGraduacao">Pós-Graduação Lato Senso</SelectItem>
                    <SelectItem value="mestrado">Mestrado</SelectItem>
                    <SelectItem value="doutorado">Doutorado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationDate">Mês/Ano de conclusão da graduação (se aplicável)</Label>
                <Input
                  id="graduationDate"
                  type="month"
                  value={profile.graduationDate}
                  onChange={(e) => handleChange("graduationDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Minha organização</Label>
                <Input
                  id="organization"
                  value={profile.organization}
                  onChange={(e) => handleChange("organization", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Site</Label>
                <Input
                  id="website"
                  type="url"
                  value={profile.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://www.exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgType">Tipo</Label>
                <Select value={profile.orgType} onValueChange={(value) => handleChange("orgType", value)}>
                  <SelectTrigger id="orgType">
                    <SelectValue placeholder="Selecione o tipo de organização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publica">Pública</SelectItem>
                    <SelectItem value="privada">Privada</SelectItem>
                    <SelectItem value="3oSetor">3º Setor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgSize">Porte</Label>
                <Select value={profile.orgSize} onValueChange={(value) => handleChange("orgSize", value)}>
                  <SelectTrigger id="orgSize">
                    <SelectValue placeholder="Selecione o porte da organização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">Micro</SelectItem>
                    <SelectItem value="pequena">Pequena</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="grande">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCount">Número de colaboradores</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  min="1"
                  value={profile.employeeCount}
                  onChange={(e) => handleChange("employeeCount", e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Continuar para a pesquisa
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  )
}

