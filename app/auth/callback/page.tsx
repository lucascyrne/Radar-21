'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/resources/auth/auth.service';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function processAuth() {
      try {
        // Verificar se há uma sessão ativa
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          router.push('/auth');
          return;
        }

        // Verificar se há um convite pendente no localStorage
        const pendingInvite = localStorage.getItem('pendingInvite');
        const pendingInviteEmail = localStorage.getItem('pendingInviteEmail');

        if (pendingInvite) {
          try {
            // Processar o convite pendente
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
              throw new Error('Usuário não encontrado');
            }
            
            // Verificar se o usuário já é membro da equipe
            const { data: existingMember, error: memberError } = await supabase
              .from('team_members')
              .select('*')
              .eq('team_id', pendingInvite)
              .eq('email', user.email)
              .maybeSingle();
            
            if (memberError && memberError.code !== 'PGRST116') {
              console.error('Erro ao verificar membro:', memberError);
            }
            
            if (existingMember) {
              // Atualizar membro existente
              const { error: updateError } = await supabase
                .from('team_members')
                .update({ 
                  user_id: user.id,
                  status: 'invited'
                })
                .eq('id', existingMember.id);
              
              if (updateError) {
                console.error('Erro ao atualizar membro:', updateError);
                throw updateError;
              }
            } else if (pendingInviteEmail) {
              // Tentar encontrar pelo email do convite
              const { data: invitedMember, error: invitedError } = await supabase
                .from('team_members')
                .select('*')
                .eq('team_id', pendingInvite)
                .eq('email', pendingInviteEmail)
                .maybeSingle();
                
              if (!invitedError && invitedMember) {
                // Atualizar o membro convidado
                const { error: updateError } = await supabase
                  .from('team_members')
                  .update({ 
                    user_id: user.id,
                    email: user.email,
                    status: 'invited'
                  })
                  .eq('id', invitedMember.id);
                
                if (updateError) {
                  console.error('Erro ao atualizar membro:', updateError);
                  throw updateError;
                }
              } else {
                // Adicionar novo membro
                const { error: insertError } = await supabase
                  .from('team_members')
                  .insert({
                    team_id: pendingInvite,
                    user_id: user.id,
                    email: user.email || pendingInviteEmail,
                    role: 'member',
                    status: 'invited'
                  });
                
                if (insertError) {
                  console.error('Erro ao adicionar membro:', insertError);
                  throw insertError;
                }
              }
            }
            
            // Limpar dados do convite
            localStorage.removeItem('pendingInvite');
            localStorage.removeItem('pendingInviteEmail');
          } catch (inviteError: any) {
            console.error('Erro ao processar convite:', inviteError);
          }
        }

        // Redirecionar para a página principal
        router.push('/team-setup');
      } catch (error: any) {
        console.error('Erro na autenticação:', error);
        setError(error.message);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    }

    processAuth();
  }, [router]);

  // Mostrar carregando enquanto processa
  return (
    <div className="flex items-center justify-center min-h-screen">
      {loading ? (
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg">Concluindo autenticação...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500">
          <p>Erro durante a autenticação: {error}</p>
        </div>
      ) : null}
    </div>
  );
} 