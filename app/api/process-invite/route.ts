import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, userId, email } = body;
    
    if (!teamId || !email) {
      return NextResponse.json(
        { error: 'Faltam parâmetros obrigatórios' },
        { status: 400 }
      );
    }
    
    console.log(`Processando convite para equipe ${teamId}, usuário ${userId}, email ${email}`);
    
    // Verificar se o membro já existe na equipe
    const { data: existingMember, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('email', email)
      .single();
    
    if (memberError && memberError.code !== 'PGRST116') {
      console.error(`Erro ao verificar membro:`, memberError);
      throw new Error(`Erro ao verificar membro: ${memberError.message}`);
    }
    
    let memberId;
    
    if (existingMember) {
      console.log(`Membro existente encontrado com id ${existingMember.id}`);
      
      // Atualizar o userId e manter o status atual
      const { error: updateError } = await supabase
        .from('team_members')
        .update({
          user_id: userId,
          // Não alterar o status aqui
        })
        .eq('id', existingMember.id);
      
      if (updateError) {
        console.error(`Erro ao atualizar membro:`, updateError);
        throw new Error(`Erro ao atualizar membro: ${updateError.message}`);
      }
      
      memberId = existingMember.id;
    } else {
      console.log(`Membro não encontrado. Criando novo membro.`);
      
      // Adicionar novo membro à equipe
      const { data: newMember, error: insertError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          email: email,
          role: 'member',
          status: 'invited'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error(`Erro ao adicionar membro:`, insertError);
        throw new Error(`Erro ao adicionar membro: ${insertError.message}`);
      }
      
      memberId = newMember.id;
    }
    
    console.log(`Processamento de convite concluído com sucesso. MemberId: ${memberId}`);
    
    return NextResponse.json({ 
      success: true, 
      memberId 
    });
  } catch (error: any) {
    console.error('Erro ao processar convite:', error);
    
    return NextResponse.json(
      { error: error.message || 'Erro ao processar convite' },
      { status: 500 }
    );
  }
} 