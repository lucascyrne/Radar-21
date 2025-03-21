import { createContext } from 'react';
import { InviteData } from './invite-model';

export interface InviteState {
  isProcessing: boolean;
  error: string | null;
  pendingInviteId?: string;
}

export interface InviteActions {
  sendInvite: (data: InviteData) => Promise<void>;
  resendInvite: (data: InviteData) => Promise<void>;
  processInvite: (userId: string, email: string, teamId: string) => Promise<void>;
  clearPendingInvite: () => void;
}

export type InviteContextType = InviteState & InviteActions; 

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