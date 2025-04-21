"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/resources/auth/auth-hook";
import { Activity, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";

// Lista de rotas que são consideradas autenticadas
const AUTHENTICATED_ROUTES = [
  "/team-setup",
  "/demographic-data",
  "/survey",
  "/open-questions",
  "/results",
  "/profile",
];

// Componente memoizado para evitar renderizações desnecessárias
export const Header = memo(function Header() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Verificar se estamos em uma rota autenticada
  const isAuthenticatedRoute = AUTHENTICATED_ROUTES.some((route) =>
    pathname?.startsWith(route)
  );

  // Mostrar link para Team Setup apenas em rotas autenticadas
  const showTeamSetupLink = isAuthenticatedRoute;

  // Garantir que o componente só gere elementos interativos no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    setIsSheetOpen(false);
    router.push("/auth/logout");
  };

  // Obter as iniciais do email do usuário
  const getUserInitials = (email: string | null | undefined) => {
    if (!email) return "U";
    const parts = email.split("@");
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Obter o nome de exibição do usuário caso tenha se não usar o email
  const getDisplayName = (
    name: string | null | undefined,
    email: string | null | undefined
  ) => {
    if (!isAuthenticated) return "Usuário";
    return name || email?.split("@")[0] || "Usuário";
  };

  // Conteúdo de navegação
  const NavContent = () => (
    <>
      <Link
        href="/"
        className="text-sm font-medium hover:text-primary transition-colors"
        onClick={() => setIsSheetOpen(false)}
      >
        Home
      </Link>

      {showTeamSetupLink && (
        <Link
          href="/team-setup"
          className="text-sm font-medium hover:text-primary transition-colors"
          onClick={() => setIsSheetOpen(false)}
        >
          Team Setup
        </Link>
      )}
    </>
  );

  // Renderização de conteúdo sensível à autenticação
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Radar 21</span>
          </Link>

          {/* Navegação para desktop */}
          <nav className="hidden md:flex items-center space-x-4 min-w-[100px]">
            <NavContent />
          </nav>

          {/* Autenticação para desktop */}
          <div className="hidden md:block min-w-[140px]">
            {isMounted && isAuthenticatedRoute && isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  Bem-vindo, {getDisplayName(user?.name, user?.email)}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials(user?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => router.push("/profile")}
                      className="cursor-pointer"
                    >
                      <Avatar className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login" onClick={() => setIsSheetOpen(false)}>
                  <Button size="sm" variant="default">
                    Acessar
                  </Button>
                </Link>
                <a
                  href="https://org.radar21.com.br/auth/login"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline">
                    Área da Organização
                  </Button>
                </a>
              </div>
            )}
          </div>

          {/* Menu para mobile */}
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-6 mt-6">
                  <div className="flex flex-col space-y-3">
                    <NavContent />
                  </div>
                  <div className="pt-4 border-t">
                    {isMounted && isAuthenticatedRoute && isAuthenticated ? (
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getUserInitials(user?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {getDisplayName(user?.name, user?.email)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="flex items-center justify-start"
                          onClick={() => {
                            setIsSheetOpen(false);
                            router.push("/profile");
                          }}
                        >
                          <Avatar className="mr-2 h-4 w-4" />
                          <span>Meu Perfil</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center justify-start"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Sair</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <Link
                          href="/auth/login"
                          onClick={() => setIsSheetOpen(false)}
                        >
                          <Button className="w-full">Acessar</Button>
                        </Link>
                        <a
                          href="https://org.radar21.com.br/auth/login"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <Button className="w-full" variant="outline">
                            Área da Organização
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
});
