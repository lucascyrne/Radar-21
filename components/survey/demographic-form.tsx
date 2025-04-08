import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useSurvey } from "@/resources/survey/survey-hook";
import {
  DemographicData,
  demographicDataSchema,
} from "@/resources/survey/survey-model";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { DemographicFormFields } from "./demographic-form-fields";

interface DemographicFormProps {
  defaultValues?: Partial<DemographicData>;
  onSubmit: (data: DemographicData) => void;
}

export function DemographicForm({
  defaultValues,
  onSubmit,
}: DemographicFormProps) {
  console.log("Renderizando DemographicForm com defaultValues:", defaultValues);
  const { loading } = useSurvey();
  const isSaving = loading.demographicData;

  const form = useForm<DemographicData>({
    resolver: zodResolver(demographicDataSchema),
    defaultValues: defaultValues || {
      name: "",
      birth_date: "",
      education: "",
      graduation_date: "",
      graduation_university: "",
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

  const handleFormSubmit = async (data: DemographicData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Erro ao submeter formulário:", error);
      // Não reseta o formulário em caso de erro para manter os dados
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu Perfil</CardTitle>
      </CardHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <CardContent className="space-y-4">
            <DemographicFormFields form={form} />
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            {form.formState.errors.root && (
              <p className="text-sm text-red-500">
                {form.formState.errors.root.message}
              </p>
            )}
            <div className="flex justify-end w-full">
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
