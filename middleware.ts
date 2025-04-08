import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentPath = request.nextUrl.pathname;

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
    const publicOnlyRoutes = ["/auth"];

    const isAuthRoute = authenticatedRoutes.some((route) =>
      currentPath.startsWith(route)
    );
    const isPublicOnlyRoute = publicOnlyRoutes.some((route) =>
      currentPath.startsWith(route)
    );

    // Verificar email confirmado
    const isEmailConfirmed = !!session?.user?.email_confirmed_at;

    // 1. Se não houver sessão e a rota requer autenticação
    if (!session && isAuthRoute) {
      const redirectUrl = new URL("/auth", request.url);
      redirectUrl.searchParams.set("redirectTo", currentPath);
      return NextResponse.redirect(redirectUrl);
    }

    // 2. Se houver sessão mas o email não está confirmado
    if (session && !isEmailConfirmed && currentPath !== "/auth/verify-email") {
      return NextResponse.redirect(new URL("/auth/verify-email", request.url));
    }

    // 3. Se houver sessão e email confirmado, mas está tentando acessar rotas públicas
    if (session && isEmailConfirmed && isPublicOnlyRoute) {
      return NextResponse.redirect(new URL("/team-setup", request.url));
    }

    return res;
  } catch (error) {
    console.error("Erro no middleware:", error);
    return NextResponse.redirect(new URL("/auth", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
