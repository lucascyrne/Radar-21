import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TooltipDescription } from "@/components/ui/tooltip-description";
import { useState } from "react";

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<string | undefined>;
}

export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const result = await onSubmit(email);
    if (result) {
      setError(result);
    } else {
      setSuccess(true);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="email">Email</Label>
          <TooltipDescription description="Digite o email associado à sua conta para receber as instruções de recuperação de senha." />
        </div>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && (
        <div className="text-green-500 text-sm">
          Instruções de recuperação de senha enviadas para seu email.
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Enviando..." : "Enviar instruções"}
      </Button>
    </form>
  );
}
