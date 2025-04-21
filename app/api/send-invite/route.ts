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
    if (!email || !teamId || !teamName || !inviteUrl) {
      console.error("[send-invite] Parâmetros obrigatórios ausentes", {
        email,
        teamId,
        teamName,
        inviteUrl,
      });
      return NextResponse.json(
        { error: "Parâmetros obrigatórios ausentes" },
        { status: 400 }
      );
    }

    console.log(
      `[send-invite] Processando convite para: ${email}, time: ${teamId}`
    );

    // 2. Criar perfil preliminar do usuário
    const { data: profileData, error: profileError } = await supabase.rpc(
      "create_preliminary_profile",
      {
        user_email: email,
        user_role: "COLLABORATOR",
      }
    );

    if (profileError) {
      console.error(
        "[send-invite] Erro ao criar perfil preliminar:",
        profileError
      );
      // Não bloquear o processo se falhar a criação do perfil
    } else {
      console.log(
        "[send-invite] Perfil preliminar criado com ID:",
        profileData
      );
    }

    // 3. Realizar operação de upsert no team_members
    const { error: memberError } = await supabase.from("team_members").upsert(
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
    );

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

    // 4. Enviar email
    try {
      const { error: emailError } = await resend.emails.send({
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
              <a href="${inviteUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Aceitar Convite</a>
            </div>
            <p style="color: #777; font-size: 14px;">
              Se você não reconhece este convite, pode ignorá-lo com segurança.
            </p>
          </div>
        `,
      });

      if (emailError) {
        console.error("[send-invite] Erro ao enviar email:", emailError);
        // Não retornamos erro aqui para não desfazer o registro do membro
      }
    } catch (emailError: any) {
      console.error("[send-invite] Exceção ao enviar email:", emailError);
      // Não retornamos erro para não desfazer o registro do membro
    }

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
