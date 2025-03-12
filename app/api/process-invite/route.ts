import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { teamId, userId, email } = await request.json();

    // Validar parâmetros
    if (!teamId || !userId || !email) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      );
    }

    // Verificar se o membro já existe
    const { data: existingMember, error: checkError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('email', email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar membro:', checkError);
      return NextResponse.json(
        { error: `Erro ao verificar membro: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (existingMember) {
      // Se o membro já existe, atualizar seu status e user_id
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ 
          user_id: userId,
          status: 'registered' 
        })
        .eq('team_id', teamId)
        .eq('email', email);

      if (updateError) {
        console.error('Erro ao atualizar membro:', updateError);
        return NextResponse.json(
          { error: `Erro ao atualizar membro: ${updateError.message}` },
          { status: 500 }
        );
      }
    } else {
      // Se o membro não existe, inserir novo registro
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          email,
          role: 'member',
          status: 'registered',
        });

      if (insertError) {
        console.error('Erro ao adicionar membro:', insertError);
        return NextResponse.json(
          { error: `Erro ao adicionar membro: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao processar convite:', error);
    return NextResponse.json(
      { error: `Erro ao processar convite: ${error.message}` },
      { status: 500 }
    );
  }
} 