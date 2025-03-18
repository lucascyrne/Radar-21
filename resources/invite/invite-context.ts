import { createContext } from 'react';
import { InviteContextType } from './invite-model';

export const InviteContext = createContext<InviteContextType>({
  pendingInvite: null,
  isProcessing: false,
  error: null,
  sendInvite: async () => {},
  processPendingInvite: async () => {},
  clearPendingInvite: () => {}
}); 