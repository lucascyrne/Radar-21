import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TeamStatusProps {
  status: "completo" | "em-progresso" | "pendente";
}

// Mapeamento de status para cores
const statusColors: Record<string, string> = {
  completo:
    "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800",
  "em-progresso":
    "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800",
  pendente:
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800",
};

// Mapeamento de status para labels
const statusLabels: Record<string, string> = {
  completo: "Completo",
  "em-progresso": "Em Progresso",
  pendente: "Pendente",
};

// Estilo base para badges sem hover
const baseBadgeStyle =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-none pointer-events-none";

export function TeamStatus({ status }: TeamStatusProps) {
  return (
    <Badge className={cn(baseBadgeStyle, statusColors[status])}>
      {statusLabels[status]}
    </Badge>
  );
}
