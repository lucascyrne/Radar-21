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
import { useEffect, useState } from "react";

interface RegisterFormProps {
  onSubmit: (data: {
    email: string;
    password: string;
    role: string;
  }) => Promise<string | undefined>;
  hideRoleSelection?: boolean;
  predefinedRole?: string;
}

const roleDescriptions = {
  USER: "Usuário que participa de equipes e responde pesquisas",
  ORGANIZATION: "Representante da organização que gerencia múltiplas equipes",
};

export function RegisterForm({
  onSubmit,
  hideRoleSelection = false,
  predefinedRole = "",
}: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState(predefinedRole);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Atualiza o role quando predefinedRole mudar
  useEffect(() => {
    if (predefinedRole) {
      setRole(predefinedRole);
    }
  }, [predefinedRole]);

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

    if (!["USER", "ORGANIZATION"].includes(role)) {
      setError("Papel inválido selecionado");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const errorMessage = await onSubmit({
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      if (errorMessage) {
        // Se recebemos uma mensagem de erro, exibimos
        setError(errorMessage);
      }
      // Se não recebemos erro, o redirecionamento será feito pelo componente pai
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
          disabled={isLoading}
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
          disabled={isLoading}
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
          disabled={isLoading}
        />
      </div>

      {!hideRoleSelection && (
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
            disabled={isLoading || !!predefinedRole}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione seu papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">Usuário</SelectItem>
              <SelectItem value="ORGANIZATION">Organização</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {hideRoleSelection && predefinedRole && (
        <div className="space-y-2">
          <div className="flex items-center">
            <Label>Tipo de Conta</Label>
          </div>
          <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
            <p className="font-medium text-blue-800">
              {predefinedRole === "ORGANIZATION" ? "Organização" : "Usuário"}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {
                roleDescriptions[
                  predefinedRole as keyof typeof roleDescriptions
                ]
              }
            </p>
          </div>
        </div>
      )}

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
