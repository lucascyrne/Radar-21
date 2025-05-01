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

  if (error || error_description) {
    return NextResponse.redirect(
      new URL(
        `/members?error=${encodeURIComponent(
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
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Erro ao trocar código por sessão:", error);
        return NextResponse.redirect(
          new URL("/members?error=session_exchange_failed", requestUrl.origin)
        );
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return NextResponse.redirect(new URL("/members", requestUrl.origin));
      }

      if (invite) {
        await InviteService.storePendingInvite(invite, inviteName || "");
      }

      if (type === "signup") {
        if (session.user.email_confirmed_at) {
          return NextResponse.redirect(
            new URL("/team-setup", requestUrl.origin)
          );
        } else {
          return NextResponse.redirect(
            new URL("/members/verify-email", requestUrl.origin)
          );
        }
      }

      return NextResponse.redirect(new URL("/team-setup", requestUrl.origin));
    } catch (error) {
      console.error("Erro no processamento do callback:", error);
      return NextResponse.redirect(
        new URL("/members?error=callback_processing", requestUrl.origin)
      );
    }
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
