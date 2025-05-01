import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST(request: NextRequest) {
  if (request.method !== "POST") {
    return new NextResponse(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { teamId, userId, email } = body;

    if (!teamId || !email) {
      return NextResponse.json(
        { error: "Faltam parâmetros obrigatórios" },
        { status: 400 }
      );
    }

    console.log(
      `Processando convite para equipe ${teamId}, usuário ${userId}, email ${email}`
    );

    // Verificar o papel do usuário para garantir que não seja organização
    if (userId) {
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("auth_id", userId)
        .maybeSingle();

      if (!profileError && userProfile?.role === "ORGANIZATION") {
        return NextResponse.json(
          {
            error: "Acesso negado",
            message: "Contas de organização não podem ser membros de equipes",
          },
          { status: 403 }
        );
      }
    }

    // Verificar se o membro já existe na equipe
    const { data: existingMember, error: memberError } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .eq("email", email)
      .maybeSingle();

    if (memberError && memberError.code !== "PGRST116") {
      console.error(`Erro ao verificar membro:`, memberError);
      throw new Error(`Erro ao verificar membro: ${memberError.message}`);
    }

    let memberId;

    if (existingMember) {
      console.log(`Membro existente encontrado com id ${existingMember.id}`);

      // Preparar dados para atualização, apenas incluir user_id se ele for válido
      const updateData: any = {};

      if (userId) {
        updateData.user_id = userId;
      }

      // Atualizar apenas se temos dados para atualizar
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("team_members")
          .update(updateData)
          .eq("id", existingMember.id);

        if (updateError) {
          console.error(`Erro ao atualizar membro:`, updateError);
          throw new Error(`Erro ao atualizar membro: ${updateError.message}`);
        }
      }

      memberId = existingMember.id;
    } else {
      console.log(`Membro não encontrado. Criando novo membro.`);

      // Preparar dados para inserção
      const memberData: any = {
        team_id: teamId,
        email: email,
        role: "member",
        status: "invited",
      };

      // Adicionar user_id apenas se ele existir
      if (userId) {
        memberData.user_id = userId;
      }

      // Adicionar novo membro à equipe
      const { data: newMember, error: insertError } = await supabase
        .from("team_members")
        .insert(memberData)
        .select()
        .single();

      if (insertError) {
        console.error(`Erro ao adicionar membro:`, insertError);
        throw new Error(`Erro ao adicionar membro: ${insertError.message}`);
      }

      memberId = newMember.id;
    }

    console.log(
      `Processamento de convite concluído com sucesso. MemberId: ${memberId}`
    );

    return NextResponse.json(
      {
        success: true,
        memberId,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("Erro ao processar convite:", error);

    // Melhorar mensagem de erro para problemas de permissão
    if (error.message && error.message.includes("row-level security policy")) {
      return NextResponse.json(
        {
          error: "Erro de permissão",
          message:
            "Você não tem permissão para adicionar membros a esta equipe.",
          details: error.message,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Erro ao processar convite" },
      { status: 500 }
    );
  }
}
