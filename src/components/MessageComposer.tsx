import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Send } from 'lucide-react';

interface MessageComposerProps {
  onMessageSent?: () => void;
}

export function MessageComposer({ onMessageSent }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending } = useNostrPublish();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    createEvent({
      kind: 1,
      content: content.trim()
    }, {
      onSuccess: () => {
        setContent('');
        onMessageSent?.();
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!content.trim() || isPending) return;
      handleSubmit(e);
    }
  };

  if (!user) {
    return (
      <div className="border-t bg-background p-4">
        <div className="text-center text-muted-foreground">
          Please log in to send messages
        </div>
      </div>
    );
  }

  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="resize-none min-h-[44px] max-h-32 border-2 focus-visible:ring-1"
            rows={1}
          />
        </div>
        <Button
          type="submit"
          disabled={!content.trim() || isPending}
          size="sm"
          className="h-11 w-11 rounded-full p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <div className="text-xs text-muted-foreground mt-2 text-center">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}