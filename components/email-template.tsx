import { EmailTemplateProps } from '@/resources/email/email-model';

export function InviteEmailTemplate({ inviteUrl, message }: Partial<EmailTemplateProps>) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#333' }}>Convite para o Radar21</h1>
      <p dangerouslySetInnerHTML={{ __html: message || '' }} />
      <div style={{ margin: '30px 0' }}>
        <a
          href={inviteUrl}
          style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '10px 20px',
            textDecoration: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
          }}
        >
          Aceitar Convite
        </a>
      </div>
      <p>Se o botão não funcionar, copie e cole o link a seguir no seu navegador:</p>
      <p style={{ wordBreak: 'break-all', color: '#4f46e5' }}>{inviteUrl}</p>
      <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />
      <p style={{ color: '#666', fontSize: '12px' }}>
        Este é um email automático. Por favor, não responda a este email.
      </p>
    </div>
  );
}