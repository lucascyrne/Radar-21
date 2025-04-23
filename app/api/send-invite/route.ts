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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
      )}/auth?invite=${teamId}&email=${encodeURIComponent(email)}`;

    console.log(
      `[send-invite] Processando convite para: ${email}, time: ${teamId}, url: ${finalInviteUrl}`
    );

    // 2. Executar operações em paralelo
    const [profileResult, memberResult] = await Promise.all([
      // Criar perfil preliminar
      supabase.rpc("create_preliminary_profile", {
        user_email: email,
        user_role: "COLLABORATOR",
      }),
      // Registrar membro na equipe
      supabase.from("team_members").upsert(
        {
          team_id: teamId,
          email: email,
          status: "invited",
          role: "member",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "team_id,email",
        }
      ),
    ]);

    // Verificar erros críticos
    if (memberResult.error) {
      console.error(
        "[send-invite] Erro ao registrar membro:",
        memberResult.error
      );
      return NextResponse.json(
        {
          error: "Erro ao registrar membro",
          details: memberResult.error.message,
        },
        { status: 500 }
      );
    }

    // 3. Enviar email de forma assíncrona
    // Não esperamos a conclusão do envio para retornar a resposta
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
    return NextResponse.json({ success: true });
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
