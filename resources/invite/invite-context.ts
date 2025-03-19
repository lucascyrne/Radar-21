import { createContext, useContext } from 'react';
import { InviteContextType } from './invite-model';

const defaultContext: InviteContextType = {
  isProcessing: false,
  error: null,
  pendingInviteId: undefined,
  sendInvite: async () => { throw new Error('InviteContext não foi inicializado') },
  resendInvite: async () => { throw new Error('InviteContext não foi inicializado') },
  processInvite: async () => { throw new Error('InviteContext não foi inicializado') },
  clearPendingInvite: () => { throw new Error('InviteContext não foi inicializado') }
};

export const InviteContext = createContext<InviteContextType>(defaultContext);