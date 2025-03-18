export interface InviteData {
  teamId: string;
  teamName: string;
  email: string;
  invitedBy: string;
  message?: string;
}

export interface PendingInvite {
  teamId: string;
}

export type InviteStatus = 'invited' | 'accepted' | 'declined';

export interface InviteContextState {
  pendingInvite: PendingInvite | null;
  isProcessing: boolean;
  error: string | null;
}

export interface InviteContextActions {
  sendInvite: (data: InviteData) => Promise<void>;
  processPendingInvite: (userId: string, email: string) => Promise<void>;
  clearPendingInvite: () => void;
}

export type InviteContextType = InviteContextState & InviteContextActions; 