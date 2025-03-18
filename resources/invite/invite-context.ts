import { createContext } from 'react';
import { InviteData, PendingInvite } from './invite-model';

export interface InviteContextState {
  pendingInvite: PendingInvite | null;
  isProcessing: boolean;
  error: string | null;
  sendInvite: (data: InviteData) => Promise<void>;
  processPendingInvite: (userId: string, email: string) => Promise<void>;
  clearPendingInvite: () => void;
}

export const InviteContext = createContext<InviteContextState>({
  pendingInvite: null,
  isProcessing: false,
  error: null,
  sendInvite: async () => {},
  processPendingInvite: async () => {},
  clearPendingInvite: () => {}
}); 