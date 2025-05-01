import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

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
    "/members",
    "/organizations",
    "/api",
    "/cookies",
    "/terms",
    "/privacy",
    "/favicon.ico",
  ];

  const isPublicRoute =
    pathname === "/" ||
    publicPatterns.some((pattern) => pathname.startsWith(pattern));

  // Verificar se está tentando acessar rotas de organização no domínio principal
  if (!isOrgSubdomain && pathname.startsWith("/dashboard")) {
    // Redirecionar para o subdomínio org
    const url = request.nextUrl.clone();
    url.host = `org.${hostname}`;
    return NextResponse.redirect(url);
  }

  // Verificar se está tentando acessar rotas normais no subdomínio org
  if (isOrgSubdomain && pathname.startsWith("/team-setup")) {
    // Redirecionar para o domínio principal
    const url = request.nextUrl.clone();
    url.host = hostname.replace(/^org\./, "");
    return NextResponse.redirect(url);
  }

  // Redirecionar members/login para organizations/login no subdomínio org
  if (isOrgSubdomain && pathname.startsWith("/members/login")) {
    return NextResponse.redirect(new URL("/organizations/login", request.url));
  }

  // Redirecionar organizations/login para members/login no domínio principal
  if (!isOrgSubdomain && pathname.startsWith("/organizations/login")) {
    return NextResponse.redirect(new URL("/members/login", request.url));
  }

  // Se for rota pública, permitir acesso sem verificação
  if (isPublicRoute) {
    return response;
  }

  // Para todas as outras rotas, verificar autenticação
  const token = request.cookies.get("sb-access-token");
  if (!token) {
    // Redirecionar para a página de login apropriada
    const loginPath = isOrgSubdomain ? "/organizations/login" : "/members/login";
    const url = new URL(loginPath, request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
