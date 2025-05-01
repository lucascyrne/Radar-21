import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Log para debug - verificar se a chave está disponível (não logar a chave completa por segurança)
const resendApiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY;
console.log(
  "API Resend disponível:",
  resendApiKey ? `${resendApiKey.substring(0, 5)}...` : "Não definida"
);

// Inicializar o cliente Resend com a chave de API correta
const resend = new Resend(resendApiKey);

// Criar cliente Supabase com autenticação anônima
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const runtime = "edge"; // Otimização: usar Edge Runtime
export const maxDuration = 5; // Limitar a 5 segundos

export async function POST(request: NextRequest) {
  console.log("[send-invite] Iniciando processamento de convite");

  if (request.method !== "POST") {
    return new NextResponse(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { email, inviteUrl, message, teamId, teamName, invitedBy } =
      await request.json();

    // 1. Validações básicas
    if (!email || !teamId || !teamName) {
      console.error("[send-invite] Parâmetros obrigatórios ausentes", {
        email,
        teamId,
        teamName,
      });
      return NextResponse.json(
        { error: "Parâmetros obrigatórios ausentes" },
        { status: 400 }
      );
    }

    // Usar a URL de convite fornecida ou construir uma nova
    const finalInviteUrl =
      inviteUrl ||
      `${request.nextUrl.origin.replace(
        "org.",
        ""
      )}/members?invite=${teamId}&email=${encodeURIComponent(email)}`;

    console.log(
      `[send-invite] Processando convite para: ${email}, time: ${teamId}, url: ${finalInviteUrl}`
    );

    // 2. Verificar se o usuário já existe no sistema
    let userId = null;
    let userRole = "USER";

    // Primeiro, verificar na tabela user_profiles
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, auth_id, role")
      .eq("email", email)
      .maybeSingle();

    if (!profileError && profileData) {
      console.log(
        "[send-invite] Usuário encontrado em user_profiles:",
        profileData
      );
      userId = profileData.auth_id;
      userRole = profileData.role;
    } else {
      // Se não encontrou no profile, verificar na tabela auth.users
      const { data: authData, error: authError } = await supabase
        .from("auth.users")
        .select("id, user_metadata")
        .eq("email", email)
        .maybeSingle();

      if (!authError && authData) {
        console.log(
          "[send-invite] Usuário encontrado em auth.users:",
          authData
        );
        userId = authData.id;
        userRole = authData.user_metadata?.role || "USER";
      }
    }

    // 3. Verificar se o usuário é uma organização
    if (userRole === "ORGANIZATION") {
      return NextResponse.json(
        {
          error: "Usuário inelegível",
          message:
            "Contas do tipo Organização não podem ser convidadas como membros de equipes.",
        },
        { status: 400 }
      );
    }

    // 4. Criar perfil preliminar se necessário
    if (!userId) {
      try {
        const { data: newProfile, error: createError } = await supabase.rpc(
          "create_preliminary_profile",
          {
            user_email: email,
            user_role: "USER",
          }
        );

        if (createError) {
          console.error(
            "[send-invite] Erro ao criar perfil preliminar:",
            createError
          );
        } else if (newProfile) {
          console.log("[send-invite] Perfil preliminar criado:", newProfile);
          // Não atribuímos userId aqui pois o perfil é preliminar
        }
      } catch (profileErr) {
        console.error(
          "[send-invite] Exceção ao criar perfil preliminar:",
          profileErr
        );
      }
    }

    // 5. Registrar ou atualizar membro na equipe
    const memberData: any = {
      team_id: teamId,
      email: email,
      status: "pending_survey",
      role: "member",
      updated_at: new Date().toISOString(),
    };

    // Adicionar user_id apenas se ele existir
    if (userId) {
      memberData.user_id = userId;
    }

    const { error: memberError } = await supabase
      .from("team_members")
      .upsert(memberData, {
        onConflict: "team_id,email",
      });

    if (memberError) {
      console.error("[send-invite] Erro ao registrar membro:", memberError);
      return NextResponse.json(
        {
          error: "Erro ao registrar membro",
          details: memberError.message,
        },
        { status: 500 }
      );
    }

    // 6. Enviar email de forma assíncrona
    resend.emails
      .send({
        from: "Radar21 <noreply@radar21.com.br>",
        to: email,
        subject: `Convite para participar da equipe ${teamName} no Radar21`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333;">Radar21</h1>
            <p style="color: #666;">Avaliação de Competências de Liderança 4.0</p>
          </div>
          <h2 style="color: #2c3e50;">Você foi convidado para a equipe "${teamName}"</h2>
          <p style="color: #555; line-height: 1.5;">
            ${
              message ||
              `Olá! Você foi convidado para participar da equipe "${teamName}" no Radar21.`
            }
            ${invitedBy ? `<br><br>Convite enviado por: ${invitedBy}` : ""}
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${finalInviteUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Aceitar Convite</a>
          </div>
          <p style="color: #777; font-size: 14px;">
            Se você não reconhece este convite, pode ignorá-lo com segurança.
          </p>
        </div>
      `,
      })
      .catch((emailError) => {
        console.error("[send-invite] Erro ao enviar email:", emailError);
        // Registrar o erro para monitoramento, mas não bloquear o fluxo
      });

    console.log("[send-invite] Convite processado com sucesso");
    return NextResponse.json({
      success: true,
      userId: userId, // Retornar o userId para debug
      userRole: userRole, // Retornar o role para debug
    });
  } catch (error: any) {
    console.error("[send-invite] Erro no processamento:", error);
    return NextResponse.json(
      {
        error: "Erro interno",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
