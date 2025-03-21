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