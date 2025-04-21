"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/resources/auth/auth-hook";
import { useOrganization } from "@/resources/organization/organization-hook";
import { LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function OrgHeader() {
  const { user, signOut } = useAuth();
  const { selectedOrganization } = useOrganization();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push("/auth");
  }, [signOut, router]);

  const getUserInitials = useCallback(() => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  }, [user]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Link href="/org/dashboard" className="flex items-center space-x-2">
            <Image
              src="/logo.svg"
              alt="Radar21 Logo"
              width={32}
              height={32}
              priority
            />
            <span className="hidden font-bold sm:inline-block">
              Radar21 | {selectedOrganization?.name || "Organização"}
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/org/dashboard" className="font-medium">
            Dashboard
          </Link>
          <Link href="/org/teams" className="font-medium">
            Equipes
          </Link>
          <Link href="/org/leaders" className="font-medium">
            Líderes
          </Link>
          <Link href="/org/open-answers" className="font-medium">
            Respostas
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || ""} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/org/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/org/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
