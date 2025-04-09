import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TooltipDescription } from "@/components/ui/tooltip-description";
import { useState } from "react";

interface LoginFormProps {
  onSubmit: (data: {
    email: string;
    password: string;
  }) => Promise<string | undefined>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await onSubmit({ email, password });
    if (result) {
      setError(result);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="email">Email</Label>
          <TooltipDescription description="Digite o email que você usou para se registrar." />
        </div>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="password">Senha</Label>
          <TooltipDescription description="Digite sua senha de acesso." />
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
