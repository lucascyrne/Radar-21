import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormLabel, FormDescription } from '@/components/ui/form';
import { CopyIcon, CheckIcon, SendIcon } from 'lucide-react';

interface TeamInviteProps {
  inviteMessage: string;
  onInviteMessageChange: (message: string) => void;
  onSendInvite: (email: string) => Promise<void>;
  isSendingInvite: boolean;
}

export function TeamInvite({ 
  inviteMessage, 
  onInviteMessageChange, 
  onSendInvite,
  isSendingInvite 
}: TeamInviteProps) {
  const [messageCopied, setMessageCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const copyInviteMessage = () => {
    navigator.clipboard.writeText(inviteMessage);
    setMessageCopied(true);
    setTimeout(() => setMessageCopied(false), 2000);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail) return;
    await onSendInvite(inviteEmail);
    setInviteEmail('');
  };

  return (
    <div className="space-y-6">
      <div>
        <FormLabel>Mensagem de convite</FormLabel>
        <FormDescription>
          Customize e envie a mensagem abaixo para sua equipe nos seus canais.
        </FormDescription>
        <div className="mt-2 relative">
          <Textarea
            value={inviteMessage}
            onChange={(e) => onInviteMessageChange(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2"
            onClick={copyInviteMessage}
          >
            {messageCopied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Input
          placeholder="Email do convidado"
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <Button 
          onClick={handleSendInvite} 
          disabled={isSendingInvite || !inviteEmail}
          className="flex items-center"
        >
          <SendIcon className="mr-2 h-4 w-4" />
          {isSendingInvite ? 'Enviando...' : 'Enviar Convite'}
        </Button>
      </div>
    </div>
  );
} 