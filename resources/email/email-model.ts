export interface EmailTemplateProps {
  inviteUrl?: string;
  message?: string;
  teamName?: string;
}

export interface EmailConfig {
  from: string;
  to: string;
  subject: string;
  react: JSX.Element;
} 