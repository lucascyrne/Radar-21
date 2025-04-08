import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // Rotas que requerem autenticação
  const authenticatedRoutes = [
    "/team-setup",
    "/profile",
    "/survey",
    "/demographic-data",
    "/open-questions",
    "/results",
  ];

  // Rotas públicas que não devem ser acessadas se autenticado
  const publicOnlyRoutes = ["/", "/auth"];

  const isAuthRoute = authenticatedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isPublicOnlyRoute = publicOnlyRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Verificar email confirmado
  const isEmailConfirmed = session?.user?.email_confirmed_at;

  if (isAuthRoute) {
    if (!session) {
      // Redirecionar para login se não estiver autenticado
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    if (!isEmailConfirmed) {
      // Redirecionar para página de verificação se email não confirmado
      return NextResponse.redirect(new URL("/auth/verify-email", request.url));
    }
  }

  if (isPublicOnlyRoute && session && request.nextUrl.pathname === "/auth") {
    // Redirecionar usuários autenticados para team-setup
    return NextResponse.redirect(new URL("/team-setup", request.url));
  }

  return res;
}
