import { EmailTemplateProps } from '@/resources/email/email-model';

export function InviteEmailTemplate({ inviteUrl, message, teamName }: Partial<EmailTemplateProps>) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2563EB', marginBottom: '10px' }}>
          Convite para o Radar21
        </h1>
        <h2 style={{ color: '#333', fontWeight: 'normal', fontSize: '18px' }}>
          Você foi convidado para participar da equipe <strong>{teamName}</strong>
        </h2>
      </div>

      <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <p style={{ color: '#4b5563', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: message || '' }} />
      </div>

      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a
          href={inviteUrl}
          style={{
            backgroundColor: '#2563EB',
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            display: 'inline-block',
            textAlign: 'center',
            fontSize: '16px',
          }}
        >
          Aceitar Convite
        </a>
      </div>

      <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px', marginTop: '30px' }}>
        <p style={{ color: '#6b7280', margin: '0 0 10px 0', fontSize: '14px' }}>
          Se o botão não funcionar, copie e cole o link a seguir no seu navegador:
        </p>
        <p style={{ 
          wordBreak: 'break-all', 
          color: '#2563EB', 
          backgroundColor: '#fff', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '14px',
          border: '1px solid #e5e7eb'
        }}>
          {inviteUrl}
        </p>
      </div>

      <div style={{ marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
        <p style={{ color: '#6b7280', fontSize: '12px', textAlign: 'center', margin: '0' }}>
          Este é um email automático. Por favor, não responda a este email.
        </p>
      </div>
    </div>
  );
}