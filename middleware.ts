import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Forçar uma nova verificação da sessão
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rotas públicas que não requerem autenticação
  const publicRoutes = [
    "/",
    "/auth",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
    "/auth/callback",
    "/auth/logout",
  ];

  // Se não houver sessão e a rota não for pública, redirecionar para login
  if (
    !session &&
    !publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Se houver sessão e estiver em uma rota de autenticação (exceto logout), redirecionar para dashboard
  if (
    session &&
    request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/auth/logout")
  ) {
    return NextResponse.redirect(new URL("/team-setup", request.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
