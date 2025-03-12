import { useContext } from 'react';
import { TeamContext } from './team-context';

export const useTeam = () => {
  const context = useContext(TeamContext);
  
  if (!context) {
    throw new Error('useTeam deve ser usado dentro de um TeamProvider');
  }
  
  return context;
}; 