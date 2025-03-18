'use client';

import React, { useState, useCallback } from 'react';
import { EmailContext } from './email-context';
import { EmailService } from './email.service';
import { EmailTemplateProps } from './email-model';

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendInviteEmail = useCallback(async (params: EmailTemplateProps) => {
    setIsSending(true);
    setError(null);
    
    try {
      await EmailService.sendInviteEmail(params);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar email');
      throw err;
    } finally {
      setIsSending(false);
    }
  }, []);

  return (
    <EmailContext.Provider
      value={{
        isSending,
        error,
        sendInviteEmail
      }}
    >
      {children}
    </EmailContext.Provider>
  );
};