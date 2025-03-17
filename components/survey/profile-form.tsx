import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { profileSchema, ProfileFormValues, UserProfile } from "@/resources/survey/survey-model";

interface ProfileFormProps {
  onSubmit: (data: ProfileFormValues) => Promise<void>;
  isSubmitting: boolean;
  defaultValues?: UserProfile | Partial<ProfileFormValues> | null;
}

export function ProfileForm({ onSubmit, isSubmitting, defaultValues = {} }: ProfileFormProps) {
  // Converter valores null para undefined para compatibilidade com o formulário
  const sanitizedValues = defaultValues ? Object.entries(defaultValues).reduce((acc, [key, value]) => {
    acc[key as keyof ProfileFormValues] = value === null ? undefined : value;
    return acc;
  }, {} as Partial<ProfileFormValues>) : {};

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
      ...sanitizedValues
    }
  });

  return (
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
                      onChange={(e) => field.onChange(e.target.value)}
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
                      onChange={(e) => field.onChange(e.target.value)}
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
  );
} 