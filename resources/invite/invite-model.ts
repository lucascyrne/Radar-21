import { TeamMemberStatus } from "../team/team-model";

export enum InviteStatus {
  PENDING = "pending_survey",
  ACCEPTED = "answered",
  INVITED = "invited",
}

export interface InviteData {
  teamId: string;
  email: string;
  teamName: string;
  invitedBy: string;
  message?: string;
  role?: string;
  inviteUrl?: string;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  status: InviteStatus;
  role: string;
  message?: string;
  invited_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberData {
  status: TeamMemberStatus;
  team_id: string;
  role: "leader" | "member";
  user_id?: string;
}
