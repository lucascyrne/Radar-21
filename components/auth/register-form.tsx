import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipDescription } from "@/components/ui/tooltip-description";
import { useState } from "react";

interface RegisterFormProps {
  onSubmit: (data: {
    email: string;
    password: string;
    role: string;
  }) => Promise<string | undefined>;
}

const roleDescriptions = {
  COLLABORATOR: "Membro da equipe que responde à pesquisa",
  LEADER: "Líder da equipe que avalia e gerencia os resultados",
  ORGANIZATION: "Representante da organização que gerencia múltiplas equipes",
};

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      setError("O email é obrigatório");
      return false;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Email inválido");
      return false;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return false;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return false;
    }

    if (!role) {
      setError("Selecione seu papel no sistema");
      return false;
    }

    if (!["COLLABORATOR", "LEADER", "ORGANIZATION"].includes(role)) {
      setError("Papel inválido selecionado");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await onSubmit({
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      if (result) {
        setError(result);
      }
    } catch (error: any) {
      setError(error.message || "Erro ao registrar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="email">Email</Label>
          <TooltipDescription description="Seu endereço de email será usado para login e comunicação." />
        </div>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          required
          placeholder="seu@email.com"
          className="lowercase"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="password">Senha</Label>
          <TooltipDescription description="Crie uma senha forte com pelo menos 6 caracteres." />
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          required
          minLength={6}
          placeholder="******"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="confirmPassword">Confirmar Senha</Label>
          <TooltipDescription description="Digite a mesma senha novamente para confirmar." />
        </div>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError(null);
          }}
          required
          minLength={6}
          placeholder="******"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="role">Seu Papel</Label>
          <TooltipDescription description="Selecione o papel que melhor descreve sua função no sistema." />
        </div>
        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value);
            setError(null);
          }}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione seu papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="COLLABORATOR">Colaborador</SelectItem>
            <SelectItem value="LEADER">Líder</SelectItem>
            <SelectItem value="ORGANIZATION">Organização</SelectItem>
          </SelectContent>
        </Select>
        {role && (
          <p className="text-sm text-muted-foreground">
            {roleDescriptions[role as keyof typeof roleDescriptions]}
          </p>
        )}
      </div>
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Registrando..." : "Registrar"}
      </Button>
    </form>
  );
}
