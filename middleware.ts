import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Obter informações sobre o request
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const isOrgSubdomain = hostname.startsWith("org.");

  // Verificar se é uma requisição de assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return response;
  }

  // Rotas públicas que não precisam de autenticação
  const publicPatterns = [
    "/",
    "/auth",
    "/org-auth",
    "/api",
    "/cookies",
    "/terms",
    "/privacy",
    "/favicon.ico",
  ];

  const isPublicRoute =
    pathname === "/" ||
    publicPatterns.some((pattern) => pathname.startsWith(pattern));

  // Se for rota pública, permitir acesso sem verificação
  if (isPublicRoute) {
    // Verificar se está tentando acessar a auth errada
    if (isOrgSubdomain && pathname.startsWith("/auth")) {
      return NextResponse.redirect(
        new URL("/org-auth" + pathname.substring(5), request.url)
      );
    }
    if (!isOrgSubdomain && pathname.startsWith("/org-auth")) {
      return NextResponse.redirect(
        new URL("/auth" + pathname.substring(9), request.url)
      );
    }
    return response;
  }

  try {
    // Verificar sessão do usuário
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Verificar papel do usuário
    const userRole = session?.user.user_metadata?.role;
    const isOrganization = userRole === "ORGANIZATION";

    // Verificar acesso ao subdomínio correto
    if (isOrgSubdomain && !isOrganization) {
      return NextResponse.redirect(new URL("/org-auth/login", request.url));
    }

    if (!isOrgSubdomain && isOrganization) {
      return NextResponse.redirect(
        new URL("https://org.radar21.com.br/org-auth/login")
      );
    }

    // Se não houver sessão, redirecionar para o login apropriado
    if (!session) {
      const loginPath = isOrgSubdomain ? "/org-auth/login" : "/auth/login";
      return NextResponse.redirect(new URL(loginPath, request.url));
    }

    return response;
  } catch (error) {
    console.error("Erro no middleware:", error);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
