export interface EmailTemplateProps {
  to: string;
  inviteUrl: string;
  teamName: string;
  invitedBy: string;
  message: string;
}

export interface EmailContextState {
  isSending: boolean;
  error: string | null;
}

export interface EmailContextActions {
  sendInviteEmail: (params: EmailTemplateProps) => Promise<void>;
}

export type EmailContextType = EmailContextState & EmailContextActions;