export interface InviteData {
  teamId: string;
  teamName: string;
  email: string;
  invitedBy: string;
  message?: string;
  inviteUrl?: string;
}

export type InviteStatus = 'pending' | 'sent' | 'accepted' | 'declined';

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

export interface EmailConfig {
  from: string;
  subject: (teamName: string) => string;
  template: (params: InviteData) => JSX.Element;
} 