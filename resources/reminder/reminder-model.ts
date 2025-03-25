export interface ReminderUser {
    id: string;
    email: string;
    team_id: string;
    teams: {
      name: string;
    };
    status: 'invited' | 'pending_survey';
    last_reminder_sent?: string;
  }
  
export interface ReminderTemplateResult {
    subject: string;
    html: string;
}
  
export interface ReminderTemplateProps {
    type: 'registration' | 'survey';
    teamName: string;
    message: string;
    actionUrl: string;
}
  