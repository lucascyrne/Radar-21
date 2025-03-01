"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Check, Copy, Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Layout } from "@/components/layout"

type TeamMember = {
  email: string
  status: "Enviado" | "Cadastrado" | "Respondido"
}

export default function TeamSetup() {
  const router = useRouter()
  const [teamName, setTeamName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userRole, setUserRole] = useState("")
  const [teamSize, setTeamSize] = useState("")
  const [members, setMembers] = useState<TeamMember[]>([])
  const [copied, setCopied] = useState(false)
  const [invitationMessage, setInvitationMessage] = useState("")
  const [hasJoinedTeam, setHasJoinedTeam] = useState(false)
  const messageRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const savedTeamName = localStorage.getItem("teamName") || ""
    const savedUserEmail = localStorage.getItem("userEmail") || ""
    const savedTeamMembers = JSON.parse(localStorage.getItem("teamMembers") || "[]")

    setTeamName(savedTeamName)
    setUserEmail(savedUserEmail)
    setMembers([
      { email: savedUserEmail, status: "Cadastrado" },
      ...savedTeamMembers.filter((member: TeamMember) => member.email !== savedUserEmail),
    ])

    updateInvitationMessage(savedTeamName, savedUserEmail)
  }, [])

  const addMember = () => {
    setMembers([...members, { email: "", status: "Enviado" }])
  }

  const updateMember = (index: number, email: string) => {
    const newMembers = [...members]
    newMembers[index].email = email
    setMembers(newMembers)
    localStorage.setItem("teamMembers", JSON.stringify(newMembers.slice(1)))
  }

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem("teamName", teamName)
    localStorage.setItem("userEmail", userEmail)
    localStorage.setItem("userRole", userRole)
    localStorage.setItem("teamSize", teamSize)
    localStorage.setItem("teamMembers", JSON.stringify(members.slice(1)))
    localStorage.setItem("isTeamCreator", "true")
  }

  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem("teamName", teamName)
    localStorage.setItem("userEmail", userEmail)
    localStorage.setItem("isTeamCreator", "false")

    const mockTeamMembers = [
      { email: userEmail, status: "Cadastrado" },
      { email: "member1@example.com", status: "Enviado" },
      { email: "member2@example.com", status: "Respondido" },
    ]
    setMembers(mockTeamMembers)
    updateInvitationMessage(teamName, userEmail)
    setHasJoinedTeam(true)
  }

  const copyMessage = () => {
    if (messageRef.current) {
      messageRef.current.select()
      document.execCommand("copy")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const updateInvitationMessage = (teamName: string, userEmail: string) => {
    setInvitationMessage(
      `Oi. Tudo bem? Favor preencher essa ferramenta para que possamos saber como nossa equipe está em relação às competências de liderança 4.0. Lembre de selecionar "Entrar em Equipe" na página de equipe e inserir o meu email ${userEmail} e o nome da equipe ${teamName}`,
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span className="font-bold">Minha Equipe</span>
            <span className="text-muted-foreground">Meu Perfil</span>
            <span className="text-muted-foreground">Radar das Competências de Liderança 4.0</span>
            <span className="text-muted-foreground">Resultados</span>
          </div>
          <Progress value={25} className="h-2" />
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">Minha Equipe</h1>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="create">Criar Equipe</TabsTrigger>
            <TabsTrigger value="join">Entrar em Equipe</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Criar Nova Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTeam} className="space-y-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="team-name">Nome da equipe</Label>
                      <Input id="team-name" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-email">Meu email</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-role">Meu papel é de:</Label>
                      <RadioGroup
                        id="user-role"
                        value={userRole}
                        onValueChange={setUserRole}
                        className="flex flex-col space-y-1"
                        required
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="leader" id="leader" />
                          <Label htmlFor="leader">Líder da equipe</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="collaborator" id="collaborator" />
                          <Label htmlFor="collaborator">Colaborador na equipe</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="team-size">Número de pessoas na equipe</Label>
                      <Input
                        id="team-size"
                        type="number"
                        min="1"
                        value={teamSize}
                        onChange={(e) => setTeamSize(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Convidar Equipe</h3>
                    <div className="space-y-2">
                      <Label htmlFor="invitation-message">Mensagem de convite</Label>
                      <Textarea
                        id="invitation-message"
                        ref={messageRef}
                        value={invitationMessage}
                        onChange={(e) => setInvitationMessage(e.target.value)}
                        rows={4}
                      />
                      <Button type="button" variant="outline" onClick={copyMessage} className="flex items-center gap-2">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Mensagem Copiada" : "Copiar Mensagem"}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Membros da Equipe</h4>
                        <Button type="button" variant="outline" size="sm" onClick={addMember} className="h-8 px-2">
                          <Plus className="h-4 w-4 mr-1" /> Adicionar
                        </Button>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Status do convite</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((member, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {index === 0 ? (
                                  member.email
                                ) : (
                                  <Input
                                    value={member.email}
                                    onChange={(e) => updateMember(index, e.target.value)}
                                    placeholder="email@exemplo.com"
                                    className="h-8"
                                  />
                                )}
                              </TableCell>
                              <TableCell>{member.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Criar Equipe e Continuar
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle>Entrar em uma Equipe Existente</CardTitle>
              </CardHeader>
              <CardContent>
                {!hasJoinedTeam ? (
                  <form onSubmit={handleJoinTeam} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="join-team-name">Nome da equipe</Label>
                      <Input
                        id="join-team-name"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="join-user-email">Meu email</Label>
                      <Input
                        id="join-user-email"
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Entrar na Equipe
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Equipe {teamName}</h3>
                      <p>Você entrou com sucesso na equipe. Aqui estão os detalhes da equipe:</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Membros da Equipe</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((member, index) => (
                            <TableRow key={index}>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>{member.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Mensagem de Convite</h4>
                      <Textarea
                        value={invitationMessage}
                        onChange={(e) => setInvitationMessage(e.target.value)}
                        rows={4}
                      />
                      <Button type="button" variant="outline" onClick={copyMessage} className="flex items-center gap-2">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Mensagem Copiada" : "Copiar Mensagem"}
                      </Button>
                    </div>

                    <Button onClick={() => router.push("/profile")} className="w-full">
                      Continuar para Meu Perfil
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

