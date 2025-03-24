import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Form,
} from "@/components/ui/form";
import { profileSchema, ProfileFormValues, UserProfile } from "@/resources/survey/survey-model";
import { useEffect } from "react";
import { ProfileFormFields } from './profile-form-fields';
import { useSurvey } from "@/resources/survey/survey-hook";
import { Loader2 } from "lucide-react";

interface ProfileFormProps {
  defaultValues?: Partial<ProfileFormValues>;
  onSubmit: (data: ProfileFormValues) => void;
}

export function ProfileForm({ defaultValues, onSubmit }: ProfileFormProps) {
  console.log('Renderizando ProfileForm com defaultValues:', defaultValues);
  const { loading } = useSurvey();
  const isSaving = loading.profile;
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaultValues || {
      name: "",
      birth_date: "",
      education: "",
      graduation_date: "",
      employee_count: 0,
      organization: "",
      org_type: "",
      org_size: "",
      city: "",
      work_model: "",
      website: "",
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  const handleFormSubmit = async (data: ProfileFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
      // Não reseta o formulário em caso de erro para manter os dados
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
                className="w-full"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}