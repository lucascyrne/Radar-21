import { InviteService } from "@/resources/invite/invite.service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const invite = requestUrl.searchParams.get("invite");
  const inviteName = requestUrl.searchParams.get("invite_name");
  const type = requestUrl.searchParams.get("type");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  // Log detalhado da requisição
  console.log("Detalhes do callback:", {
    timestamp: new Date().toISOString(),
    url: request.url,
    code: code ? "presente" : "ausente",
    type,
    invite,
    inviteName,
    error,
    error_description,
    headers: Object.fromEntries(request.headers),
  });

  if (error || error_description) {
    console.error("Erro recebido no callback:", {
      error,
      description: error_description,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.redirect(
      new URL(
        `/auth?error=${encodeURIComponent(
          error_description || error || "unknown_error"
        )}`,
        requestUrl.origin
      )
    );
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      console.log("Iniciando troca de código por sessão");
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Erro detalhado na troca de código:", {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.redirect(
          new URL("/auth?error=session_exchange_failed", requestUrl.origin)
        );
      }

      // Obter a sessão atual
      console.log("Obtendo sessão atual");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Log detalhado da sessão
      console.log("Detalhes da sessão:", {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        emailConfirmed: session?.user?.email_confirmed_at ? "sim" : "não",
        confirmationSent: session?.user?.confirmation_sent_at,
        lastSignIn: session?.user?.last_sign_in_at,
        type,
        timestamp: new Date().toISOString(),
      });

      // Se for confirmação de email e o email foi confirmado
      if (type === "signup" && session?.user?.email_confirmed_at) {
        console.log("Email confirmado com sucesso!", {
          userId: session.user.id,
          email: session.user.email,
          confirmedAt: session.user.email_confirmed_at,
        });
        return NextResponse.redirect(new URL("/team-setup", requestUrl.origin));
      }

      // Se for confirmação de email mas o email ainda não foi confirmado
      if (type === "signup" && !session?.user?.email_confirmed_at) {
        console.warn("Email ainda não confirmado:", {
          userId: session?.user?.id,
          email: session?.user?.email,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.redirect(
          new URL("/auth/verify-email", requestUrl.origin)
        );
      }

      // Se houver convite pendente
      if (invite) {
        console.log("Processando convite pendente");
        await InviteService.storePendingInvite(invite, inviteName || "");
        return NextResponse.redirect(
          new URL(
            `/auth?invite=${invite}${
              inviteName ? `&invite_name=${encodeURIComponent(inviteName)}` : ""
            }`,
            requestUrl.origin
          )
        );
      }

      // Redirecionamento padrão
      console.log("Redirecionamento padrão para /auth");
      return NextResponse.redirect(new URL("/auth", requestUrl.origin));
    } catch (error) {
      console.error("Erro completo no processamento do callback:", error);
      return NextResponse.redirect(
        new URL("/auth?error=callback_processing", requestUrl.origin)
      );
    }
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
