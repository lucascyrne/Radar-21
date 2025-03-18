import { useContext } from 'react';
import { InviteContext } from './invite-context';

export const useInvite = () => {
  const context = useContext(InviteContext);
  
  if (!context) {
    throw new Error('useInvite deve ser usado dentro de um InviteProvider');
  }
  
  return context;
}; 