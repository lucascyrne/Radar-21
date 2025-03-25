import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProfileFormValues } from '@/resources/survey/survey-model';

interface ProfileFormFieldsProps {
  form: UseFormReturn<ProfileFormValues>;
}

export function ProfileFormFields({ form }: ProfileFormFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome completo *</FormLabel>
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
            <FormLabel>Nível de escolaridade *</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
              }} 
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
          name="graduation_university"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {`Qual a instituição de ensino que você estudou ${
                  form.watch('education') === 'ensino_medio' ? 'o ensino médio' :
                  form.watch('education') === 'graduacao' ? 'a graduação' :
                  form.watch('education') === 'especializacao' ? 'a especialização' :
                  form.watch('education') === 'mestrado' ? 'o mestrado' :
                  'o doutorado'
                }?`}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nome da universidade"
                  {...field}
                />
              </FormControl>
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
            <FormLabel>Organização *</FormLabel>
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
            <FormLabel>Tipo de organização *</FormLabel>
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
            <FormLabel>Porte da organização *</FormLabel>
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
            <FormLabel>Número de funcionários *</FormLabel>
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
            <FormLabel>Cidade *</FormLabel>
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
            <FormLabel>Modelo de trabalho *</FormLabel>
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
    </>
  );
} 