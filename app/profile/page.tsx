"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Layout } from "@/components/layout"
import { useToast } from "@/hooks/use-toast"
import { useSurvey } from "@/resources/survey/survey-hook"
import { profileSchema, ProfileFormValues } from "@/resources/survey/survey-model"
import { useAuth } from "@/resources/auth/auth-hook"
import { useTeam } from "@/resources/team/team-hook"

export default function Profile() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { selectedTeam, loadTeamMembers } = useTeam()
  const { saveProfile, profile, error, teamMemberId } = useSurvey()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Inicializar o formulário com react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      birth_date: "",
      education: "",
      graduation_date: "",
      organization: "",
      website: "",
      org_type: "",
      org_size: "",
      employee_count: 0,
      city: "",
      work_model: "",
    }
  })

  // Verificar se o usuário está em uma equipe
  useEffect(() => {
    const teamId = localStorage.getItem("teamId") || selectedTeam?.id
    if (!teamId && !user?.team_id) {
      router.push("/team-setup")
    } else if (teamId && user) {
      // Carregar membros da equipe para garantir que temos o teamMemberId
      loadTeamMembers(teamId)
    }
  }, [router, user, selectedTeam, loadTeamMembers])

  // Carregar dados do perfil se existirem
  useEffect(() => {
    if (profile) {
      // Garantir que os campos de data sejam formatados corretamente para o input
      const formattedBirthDate = profile.birth_date ? 
        profile.birth_date.substring(0, 10) : "";
      
      const formattedGraduationDate = profile.graduation_date ? 
        profile.graduation_date.substring(0, 10) : "";
      
      form.reset({
        name: profile.name || "",
        birth_date: formattedBirthDate,
        education: profile.education || "",
        graduation_date: formattedGraduationDate,
        organization: profile.organization || "",
        website: profile.website || "",
        org_type: profile.org_type || "",
        org_size: profile.org_size || "",
        employee_count: profile.employee_count || 0,
        city: profile.city || "",
        work_model: profile.work_model || "",
      });
    } else {
      // Tentar carregar do localStorage para compatibilidade com código existente
      const savedProfile = localStorage.getItem("userProfile")
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile)
          form.reset({
            ...parsedProfile,
            // Garantir que employee_count seja um número
            employee_count: typeof parsedProfile.employee_count === 'string' 
              ? parseInt(parsedProfile.employee_count, 10) || 0 
              : parsedProfile.employee_count || 0
          })
        } catch (e) {
          console.error("Erro ao carregar perfil salvo:", e)
        }
      }
    }
  }, [profile, form]);

  // Exibir mensagem de erro se houver
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const onSubmit = useCallback(async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true)
      
      // Verificar e formatar os dados antes de enviar
      const formattedData = {
        ...data,
        // Garantir que employee_count seja um número
        employee_count: typeof data.employee_count === 'string' 
          ? parseInt(data.employee_count, 10) || 0 
          : data.employee_count || 0
      };
      
      // Salvar no localStorage para compatibilidade com o código existente
      localStorage.setItem("userProfile", JSON.stringify(formattedData))
      localStorage.setItem("userEmail", user?.email || "")
      
      console.log("Enviando dados do perfil:", formattedData);
      
      const result = await saveProfile(formattedData)
      
      if (result) {
        toast({
          title: "Perfil salvo",
          description: "Seu perfil foi salvo com sucesso!",
        })
        
        router.push("/survey")
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message || "Ocorreu um erro ao salvar seu perfil.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [saveProfile, user, router, toast])

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
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de nascimento</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          placeholder="AAAA-MM-DD" 
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            console.log("birth_date alterado:", e.target.value);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de escolaridade</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seu nível de escolaridade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ensino_medio">Ensino Médio</SelectItem>
                          <SelectItem value="graduacao">Graduação</SelectItem>
                          <SelectItem value="especializacao">Especialização</SelectItem>
                          <SelectItem value="mestrado">Mestrado</SelectItem>
                          <SelectItem value="doutorado">Doutorado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="graduation_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de formação</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          placeholder="AAAA-MM-DD" 
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            console.log("graduation_date alterado:", e.target.value);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organização</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da sua organização" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://www.exemplo.com.br" 
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="org_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de organização</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de organização" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="publica">Pública</SelectItem>
                          <SelectItem value="privada">Privada</SelectItem>
                          <SelectItem value="ong">ONG</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="org_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porte da organização</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o porte da organização" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="micro">Micro (até 19 funcionários)</SelectItem>
                          <SelectItem value="pequena">Pequena (20 a 99 funcionários)</SelectItem>
                          <SelectItem value="media">Média (100 a 499 funcionários)</SelectItem>
                          <SelectItem value="grande">Grande (500+ funcionários)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employee_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de funcionários</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Número aproximado" 
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Sua cidade" 
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="work_model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo de trabalho</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o modelo de trabalho" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="presencial">Presencial</SelectItem>
                          <SelectItem value="hibrido">Híbrido</SelectItem>
                          <SelectItem value="remoto">Remoto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Salvando..." : "Continuar"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  )
}

