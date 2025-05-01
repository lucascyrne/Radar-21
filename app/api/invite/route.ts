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

    // Buscar informações do usuário em todas as fontes possíveis
    let userId = null;
    let userRole = null;

    // 1. Verificar em user_profiles
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, auth_id, role")
      .eq("email", email)
      .maybeSingle();

    if (!profileError && profileData) {
      console.log("[invite] Usuário encontrado em user_profiles:", profileData);
      userId = profileData.auth_id;
      userRole = profileData.role;
    }

    // 2. Se não encontrou, verificar em auth.users
    if (!userId) {
      const { data: authData, error: authError } = await supabase
        .from("auth.users")
        .select("id, user_metadata")
        .eq("email", email)
        .maybeSingle();

      if (!authError && authData) {
        console.log("[invite] Usuário encontrado em auth.users:", authData);
        userId = authData.id;
        userRole = authData.user_metadata?.role;
      }
    }

    // 3. Verificar se é uma organização
    if (userRole === "ORGANIZATION") {
      return NextResponse.json(
        {
          error: "Usuário inelegível",
          message:
            "Contas do tipo Organização não podem ser membros de equipes",
        },
        { status: 403 }
      );
    }

    // 4. Se o usuário não existir, criar um perfil preliminar
    if (!userId) {
      const userRole = role === "leader" ? "LEADER" : "USER";

      try {
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
          // Continuamos mesmo com erro para tentar registrar o membro
        } else {
          console.log("[invite] Perfil preliminar criado com sucesso");
        }
      } catch (profileErr) {
        console.error(
          "[invite] Exceção ao criar perfil preliminar:",
          profileErr
        );
        // Continuamos mesmo com erro
      }
    }

    // 5. Verificar se o time existe
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

    // 6. Verificar se o usuário já é membro do time
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
        const updateData: any = {
          status: "invited",
          role: role,
          updated_at: new Date().toISOString(),
        };

        // Adicionar user_id se ele existir
        if (userId) {
          updateData.user_id = userId;
        }

        const { error: updateError } = await supabase
          .from("team_members")
          .update(updateData)
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
      // 7. Adicionar novo membro à equipe
      const memberData: any = {
        team_id: teamId,
        email: email,
        role: role,
        status: "invited",
        updated_at: new Date().toISOString(),
      };

      // Adicionar user_id apenas se ele existir
      if (userId) {
        memberData.user_id = userId;
      }

      const { error: addError } = await supabase
        .from("team_members")
        .upsert(memberData, {
          onConflict: "team_id,email",
        });

      if (addError) {
        console.error("[invite] Erro ao adicionar membro:", addError);
        return NextResponse.json(
          { error: "Erro ao adicionar membro" },
          { status: 500 }
        );
      }
    }

    // 8. Enviar email de convite usando a API existente
    const origin = request.nextUrl.origin;
    const baseUrl =
      origin.startsWith("https://org.") || origin.startsWith("http://org.")
        ? origin.replace(/^(https?:\/\/)org\./, "$1")
        : origin;
    const inviteUrl = `${baseUrl}/members?invite=${teamId}&email=${encodeURIComponent(
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
      userId: userId, // Retornar para debug
      userRole: userRole, // Retornar para debug
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
