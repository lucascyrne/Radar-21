import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = "edge";
export const maxDuration = 5;

export async function POST(request: NextRequest) {
  console.log("[invite] Iniciando processamento do convite");

  if (request.method !== "POST") {
    return new NextResponse(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { email, teamId, role = "member" } = await request.json();

    // Validações básicas
    if (!email || !teamId) {
      return NextResponse.json(
        { error: "Email e ID do time são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("id, auth_id, role")
      .eq("email", email)
      .single();

    let userId = userData?.auth_id || null;

    // Se o usuário não existir, criar um perfil preliminar
    if (!userData) {
      // Certificar-se de que nunca criamos uma organização através de convites
      const userRole = role === "leader" ? "LEADER" : "COLLABORATOR";

      const { data: newProfile, error: profileError } = await supabase.rpc(
        "create_preliminary_profile",
        {
          user_email: email,
          user_role: userRole,
        }
      );

      if (profileError) {
        console.error(
          "[invite] Erro ao criar perfil preliminar:",
          profileError
        );
        return NextResponse.json(
          { error: "Erro ao criar perfil preliminar" },
          { status: 500 }
        );
      }
    }

    // Verificar se o time existe
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("id, name, owner_email")
      .eq("id", teamId)
      .single();

    if (teamError || !teamData) {
      console.error("[invite] Erro ao verificar time:", teamError);
      return NextResponse.json(
        { error: "Time não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário já é membro do time
    const { data: existingMember, error: memberError } = await supabase
      .from("team_members")
      .select("id, status")
      .eq("team_id", teamId)
      .eq("email", email)
      .maybeSingle();

    if (existingMember) {
      console.log("[invite] Usuário já é membro do time, atualizando status");

      // Se o usuário já é membro, apenas atualizar o status se necessário
      if (existingMember.status !== "answered") {
        const { error: updateError } = await supabase
          .from("team_members")
          .update({
            status: "invited",
            role: role,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingMember.id);

        if (updateError) {
          console.error("[invite] Erro ao atualizar membro:", updateError);
          return NextResponse.json(
            { error: "Erro ao atualizar membro" },
            { status: 500 }
          );
        }
      }
    } else {
      // Adicionar o usuário ao time
      const { error: addError } = await supabase.from("team_members").insert({
        team_id: teamId,
        user_id: userId,
        email: email,
        role: role,
        status: "invited",
      });

      if (addError) {
        console.error("[invite] Erro ao adicionar membro:", addError);
        return NextResponse.json(
          { error: "Erro ao adicionar membro" },
          { status: 500 }
        );
      }
    }

    // Enviar email de convite usando a API existente
    const origin = request.nextUrl.origin;
    const baseUrl =
      origin.startsWith("https://org.") || origin.startsWith("http://org.")
        ? origin.replace(/^(https?:\/\/)org\./, "$1")
        : origin;
    const inviteUrl = `${baseUrl}/auth?invite=${teamId}&email=${encodeURIComponent(
      email
    )}`;

    const response = await fetch(`${request.nextUrl.origin}/api/send-invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        inviteUrl,
        teamId,
        teamName: teamData.name,
        invitedBy: teamData.owner_email,
      }),
    });

    if (!response.ok) {
      console.warn("[invite] Aviso: Email não enviado, mas convite processado");
    }

    return NextResponse.json({
      success: true,
      message: "Convite processado com sucesso",
      memberId: existingMember?.id || null,
    });
  } catch (error: any) {
    console.error("[invite] Erro no processamento:", error);
    return NextResponse.json(
      {
        error: "Erro interno",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
