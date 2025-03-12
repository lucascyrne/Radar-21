import * as React from 'react';

interface InviteEmailTemplateProps {
  teamName: string;
  ownerEmail: string;
  message: string;
  inviteUrl: string;
}

export const InviteEmailTemplate: React.FC<Readonly<InviteEmailTemplateProps>> = ({
  teamName,
  ownerEmail,
  message,
  inviteUrl,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <h2>Você foi convidado para participar do Radar21</h2>
    <p>{ownerEmail} convidou você para participar da equipe "{teamName}" no Radar21.</p>
    
    <p style={{ margin: '20px 0', padding: '10px', backgroundColor: '#f5f5f5', borderLeft: '4px solid #0070f3' }}>
      "{message}"
    </p>
    
    <p>O Radar21 é uma plataforma que ajuda equipes a avaliar suas competências de liderança na era da Indústria 4.0.</p>
    
    <div style={{ margin: '30px 0' }}>
      <a 
        href={inviteUrl} 
        style={{ 
          backgroundColor: '#0070f3', 
          color: 'white', 
          padding: '12px 24px', 
          textDecoration: 'none', 
          borderRadius: '4px', 
          fontWeight: 'bold' 
        }}
      >
        Aceitar Convite
      </a>
    </div>
    
    <p style={{ color: '#666', fontSize: '14px' }}>
      Se você não esperava este convite, pode ignorar este email.
    </p>
  </div>
); 