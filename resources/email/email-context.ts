import { createContext } from 'react';
import { EmailContextType } from './email-model';

export const EmailContext = createContext<EmailContextType>({
  isSending: false,
  error: null,
  sendInviteEmail: async () => {}
});