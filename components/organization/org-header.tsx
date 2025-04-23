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
import { Activity, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function OrgHeader() {
  const { user, signOut } = useAuth();
  const { selectedOrganization } = useOrganization();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Efeito para marcar o componente como montado no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push("/org-auth/login");
  }, []);

  const getUserInitials = useCallback(() => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  }, [user]);

  if (!isMounted) {
    return (
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="hidden font-bold sm:inline-block">Radar21</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">
            Radar21 | {selectedOrganization?.name || "Organização"}
          </span>
        </Link>

        <nav className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-6 text-sm">
          <Link
            href="/dashboard"
            className="font-medium transition hover:text-primary"
          >
            Dashboard
          </Link>
          <Link
            href="/teams"
            className="font-medium transition hover:text-primary"
          >
            Equipes
          </Link>
        </nav>

        <div className="flex items-center">
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
                <Link href="/org-profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
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
