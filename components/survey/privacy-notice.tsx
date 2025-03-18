import { Shield } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function PrivacyNotice() {
  return (
    <Alert className="mb-6 bg-primary/5 border-primary/10">
      <Shield className="h-5 w-5 text-primary" />
      <AlertTitle>Suas respostas são confidenciais</AlertTitle>
      <AlertDescription>
        Todas as respostas são anônimas e serão apresentadas apenas de forma agregada.
        Nem a liderança nem a organização têm acesso às respostas individuais.
      </AlertDescription>
    </Alert>
  )
}