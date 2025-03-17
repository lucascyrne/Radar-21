"use client"

import Link from "next/link"
import { Activity, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/resources/auth/auth-hook"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState, memo } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// Lista de rotas que precisam do link de Team Setup
const TEAM_ROUTES = ['/team-setup', '/profile-survey', '/survey', '/open-questions', '/results'];

// Componente memoizado para evitar renderizações desnecessárias
export const Header = memo(function Header() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  
  // Verificar se a rota atual precisa de dados de equipe
  const showTeamSetupLink = TEAM_ROUTES.some(route => pathname?.startsWith(route));
  
  // Garantir que o componente só acesse o contexto de autenticação no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const handleLogout = async () => {
    await signOut()
    setIsSheetOpen(false)
    router.push('/auth')
  }
  
  // Obter as iniciais do email do usuário
  const getUserInitials = (email: string | null | undefined) => {
    if (!email) return "U"
    const parts = email.split('@')
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  // Obter o nome de exibição do usuário caso tenha se não usar o email
  const getDisplayName = (name: string | null | undefined) => {
    if (!name) return "Usuário"
    return name
  }

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

      {isClient && user && (
        <Link 
          href="/team-setup" 
          className="text-sm font-medium hover:text-primary transition-colors"
          onClick={() => setIsSheetOpen(false)}
        >
          Team Setup
        </Link>
      )}
    </>
  )

  // Conteúdo de autenticação
  const AuthContent = () => (
    <>
      {isClient && (
        <>
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">
                Bem-vindo, {getDisplayName(user.name)}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth" onClick={() => setIsSheetOpen(false)}>
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link href="/auth?tab=signup" onClick={() => setIsSheetOpen(false)}>
                <Button size="sm">Signup</Button>
              </Link>
            </div>
          )}
        </>
      )}
    </>
  )

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Radar 21</span>
          </Link>
          
          {/* Navegação para desktop */}
          <nav className="hidden md:flex items-center space-x-4">
            <NavContent />
          </nav>
          
          {/* Autenticação para desktop */}
          <div className="hidden md:block">
            <AuthContent />
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
                    {user ? (
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getUserInitials(user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{getDisplayName(user.email)}</span>
                        </div>
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
                        <Link href="/auth" onClick={() => setIsSheetOpen(false)}>
                          <Button variant="outline" className="w-full">Login</Button>
                        </Link>
                        <Link href="/auth?tab=signup" onClick={() => setIsSheetOpen(false)}>
                          <Button className="w-full">Signup</Button>
                        </Link>
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
  )
})

