import { EmailConfig } from "@/resources/email/email-model";

export interface InviteData {
  teamId: string;
  teamName: string;
  email: string;
  invitedBy: string;
  message?: string;
  inviteUrl?: string;
}

export type InviteStatus = 'invited' | 'answered' | 'pending_survey';

export interface TeamMemberData {
  status: InviteStatus;
  team_id: string;
  role: 'leader' | 'member';
  user_id?: string;
}

export interface InviteState {
  isProcessing: boolean;
  error: string | null;
  pendingInviteId?: string;
}

export interface InviteActions {
  sendInvite: (data: InviteData) => Promise<void>;
  resendInvite: (data: InviteData) => Promise<void>;
  processInvite: (userId: string, email: string) => Promise<void>;
  clearPendingInvite: () => void;
}

export type InviteContextType = InviteState & InviteActions; 