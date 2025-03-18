import { useContext } from 'react';
import { EmailContext } from './email-context';

export const useEmail = () => {
  const context = useContext(EmailContext);
  
  if (!context) {
    throw new Error('useEmail deve ser usado dentro de um EmailProvider');
  }
  
  return context;
};