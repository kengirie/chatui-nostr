import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NoteContent } from '@/components/NoteContent';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import type { NostrEvent } from '@nostrify/nostrify';

interface MessageBubbleProps {
  event: NostrEvent;
  className?: string;
}

export function MessageBubble({ event, className }: MessageBubbleProps) {
  const { user } = useCurrentUser();
  const author = useAuthor(event.pubkey);
  const isOwnMessage = user?.pubkey === event.pubkey;

  const displayName = author.data?.metadata?.name ?? genUserName(event.pubkey);
  const profileImage = author.data?.metadata?.picture;

  const timestamp = new Date(event.created_at * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={cn(
      "flex gap-3 mb-4 max-w-[85%]",
      isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto",
      className
    )}>
      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
        <AvatarImage src={profileImage} alt={displayName} />
        <AvatarFallback className="text-xs">
          {displayName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className={cn(
        "flex flex-col gap-1",
        isOwnMessage ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "text-xs font-medium text-muted-foreground px-1",
          isOwnMessage ? "text-right" : "text-left"
        )}>
          {displayName}
        </div>

        <div className={cn(
          "rounded-2xl px-4 py-2 max-w-xs sm:max-w-md break-words shadow-sm",
          isOwnMessage
            ? "bg-blue-500 text-white rounded-br-md"
            : "bg-white dark:bg-gray-800 border rounded-bl-md"
        )}>
          <NoteContent
            event={event}
            className={cn(
              "text-sm whitespace-pre-wrap",
              isOwnMessage ? "text-white" : ""
            )}
          />
        </div>

        <div className={cn(
          "text-xs text-muted-foreground px-1",
          isOwnMessage ? "text-right" : "text-left"
        )}>
          {timestamp}
        </div>
      </div>
    </div>
  );
}