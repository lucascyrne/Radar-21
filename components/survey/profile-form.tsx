import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
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
import { useEffect } from "react";
import { ProfileFormFields } from './profile-form-fields';

interface ProfileFormProps {
  defaultValues?: Partial<ProfileFormValues>;
  onSubmit: (data: ProfileFormValues) => void;
  isSubmitting?: boolean;
}

export function ProfileForm({ defaultValues, onSubmit, isSubmitting = false }: ProfileFormProps) {
  console.log('Renderizando ProfileForm com defaultValues:', defaultValues);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
       birth_date: '',
      education: '',
      graduation_date: '',
      organization: '',
      website: '',
      org_type: '',
      org_size: '',
      employee_count: 0,
      city: '',
      work_model: '',
      ...defaultValues,
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log('Form values changed:', value);
      console.log('Form state:', {
        isDirty: form.formState.isDirty,
        isValid: form.formState.isValid,
        errors: form.formState.errors
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleFormSubmit = async (data: ProfileFormValues) => {
    try {
      console.log('Dados do formulário antes do submit:', data);
      await onSubmit(data);
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
      form.reset(data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu Perfil</CardTitle>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <CardContent className="space-y-4">
            <ProfileFormFields form={form} />
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2">
            {form.formState.errors.root && (
              <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
            )}
            <div className="flex justify-end w-full">
              <Button 
                type="submit" 
                disabled={!form.formState.isValid || isSubmitting}
                onClick={() => {
                  console.log('Estado do formulário ao clicar:', {
                    values: form.getValues(),
                    isValid: form.formState.isValid,
                    errors: form.formState.errors,
                    isDirty: form.formState.isDirty
                  });
                }}
              >
                {isSubmitting ? 'Enviando...' : 'Continuar'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}