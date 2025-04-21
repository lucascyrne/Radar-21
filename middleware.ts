import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Obter informações sobre o request
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const isOrgSubdomain =
    hostname.startsWith("org.") || hostname.includes(".org.");

  // Rotas de autenticação e outras rotas públicas
  const publicPatterns = ["/", "/auth", "/_next", "/api", "/favicon.ico"];
  const isPublicRoute = publicPatterns.some((pattern) =>
    pathname.startsWith(pattern)
  );

  // Se for rota pública, permitir acesso sem verificação
  if (isPublicRoute) {
    return response;
  }

  // Verificar sessão do usuário
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Se não houver sessão, redirecionar para login
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Verificar papel do usuário
  const userRole = session.user.user_metadata?.role;
  const isOrganization = userRole === "ORGANIZATION";

  // Verificar se está no subdomínio correto
  if (isOrgSubdomain && !isOrganization) {
    return NextResponse.redirect(
      new URL("https://radar21.com.br/auth/login", request.url)
    );
  }

  if (!isOrgSubdomain && isOrganization) {
    return NextResponse.redirect(
      new URL("https://org.radar21.com.br/auth/login", request.url)
    );
  }

  // Usuário autenticado e no subdomínio correto
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
