import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompetencyCloudProps {
  competencies: {
    category: string;
    value: number;
  }[];
}

export function CompetencyCloud({ competencies }: CompetencyCloudProps) {
  // Normalizar valores para tamanhos de fonte (min: 1rem, max: 3rem)
  const maxValue = Math.max(...competencies.map((c) => c.value));
  const minValue = Math.min(...competencies.map((c) => c.value));
  const range = maxValue - minValue;

  const getFontSize = (value: number) => {
    const normalized = (value - minValue) / range;
    return 1 + normalized * 2; // 1rem a 3rem
  };

  const getColor = (value: number) => {
    const normalized = (value - minValue) / range;
    // Verde mais forte para valores mais altos
    return `rgb(0, ${Math.round(100 + normalized * 155)}, 0)`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competências da Equipe</CardTitle>
        <p className="text-sm text-muted-foreground">
          O tamanho de cada palavra representa a pontuação média da equipe
          naquela competência
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-center gap-4 p-8">
          {competencies.map((comp) => (
            <div
              key={comp.category}
              style={{
                fontSize: `${getFontSize(comp.value)}rem`,
                color: getColor(comp.value),
                transition: "all 0.3s ease",
              }}
              className="cursor-default hover:scale-110"
              title={`${comp.category}: ${comp.value}`}
            >
              {comp.category}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
