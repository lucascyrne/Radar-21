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
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("auth_id", userId)
      .single();

    if (profileError) {
      console.error(`Erro ao verificar perfil do usuário:`, profileError);
      // Continuamos mesmo com erro, assumindo que não é uma organização
    } else if (userProfile?.role === "ORGANIZATION") {
      return NextResponse.json(
        {
          error: "Acesso negado",
          message: "Contas de organização não podem ser membros de equipes",
        },
        { status: 403 }
      );
    }

    // Verificar se o membro já existe na equipe
    const { data: existingMember, error: memberError } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .eq("email", email)
      .single();

    if (memberError && memberError.code !== "PGRST116") {
      console.error(`Erro ao verificar membro:`, memberError);
      throw new Error(`Erro ao verificar membro: ${memberError.message}`);
    }

    let memberId;

    if (existingMember) {
      console.log(`Membro existente encontrado com id ${existingMember.id}`);

      // Atualizar o userId e manter o status atual
      const { error: updateError } = await supabase
        .from("team_members")
        .update({
          user_id: userId,
        })
        .eq("id", existingMember.id);

      if (updateError) {
        console.error(`Erro ao atualizar membro:`, updateError);
        throw new Error(`Erro ao atualizar membro: ${updateError.message}`);
      }

      memberId = existingMember.id;
    } else {
      console.log(`Membro não encontrado. Criando novo membro.`);

      // Adicionar novo membro à equipe
      const { data: newMember, error: insertError } = await supabase
        .from("team_members")
        .insert({
          team_id: teamId,
          user_id: userId,
          email: email,
          role: "member",
          status: "invited",
        })
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
