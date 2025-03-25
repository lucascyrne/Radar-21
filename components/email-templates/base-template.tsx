interface BaseTemplateProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function BaseTemplate({ title, subtitle, children }: BaseTemplateProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2563EB', marginBottom: '10px' }}>{title}</h1>
        {subtitle && (
          <h2 style={{ color: '#333', fontWeight: 'normal', fontSize: '18px' }}>{subtitle}</h2>
        )}
      </div>

      {children}

      <div style={{ marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
        <p style={{ color: '#6b7280', fontSize: '12px', textAlign: 'center', margin: '0' }}>
          Este é um email automático. Por favor, não responda a este email.
        </p>
      </div>
    </div>
  );
} 