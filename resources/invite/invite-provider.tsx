'use client';

import React, { useState, useCallback } from 'react';
import { InviteContext } from './invite-context';
import { InviteService } from './invite.service';
import { InviteData, PendingInvite } from './invite-model';

export const InviteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar convite pendente ao inicializar
  React.useEffect(() => {
    const stored = InviteService.getPendingInvite();
    if (stored.teamId) {
      setPendingInvite(stored);
    }
  }, []);

  const sendInvite = useCallback(async (data: InviteData) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      await InviteService.sendInvite(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar convite');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processPendingInvite = useCallback(async (userId: string, email: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      await InviteService.processInvite(userId, email);
      setPendingInvite(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar convite');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearPendingInvite = useCallback(() => {
    InviteService.clearPendingInvite();
    setPendingInvite(null);
  }, []);

  return (
    <InviteContext.Provider
      value={{
        pendingInvite,
        isProcessing,
        error,
        sendInvite,
        processPendingInvite,
        clearPendingInvite
      }}
    >
      {children}
    </InviteContext.Provider>
  );
}; 