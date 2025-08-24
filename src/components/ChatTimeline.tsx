import { useEffect, useRef } from 'react';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageComposer } from '@/components/MessageComposer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimeline } from '@/hooks/useTimeline';
import { LoginArea } from '@/components/auth/LoginArea';

export function ChatTimeline() {
  const { data: events, isLoading, refetch } = useTimeline();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (events && events.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [events]);

  const handleMessageSent = () => {
    // Refetch timeline and scroll to bottom
    refetch();
    setTimeout(scrollToBottom, 500);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen chat-background">
        {/* Header */}
        <div className="border-b bg-background p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Chat Timeline</h1>
            <div className="text-xs text-muted-foreground">
              <a
                href="https://soapbox.pub/mkstack"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Vibed with MKStack
              </a>
            </div>
          </div>
          <LoginArea className="max-w-60" />
        </div>

        {/* Loading messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`flex gap-3 mb-4 max-w-[85%] ${i % 3 === 0 ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className={`h-12 ${i % 3 === 0 ? 'w-48' : 'w-64'} rounded-2xl`} />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold">Chat Timeline</h1>
          <div className="text-xs text-muted-foreground">
            <a
              href="https://soapbox.pub/mkstack"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Vibed with MKStack
            </a>
          </div>
        </div>
        <LoginArea className="max-w-60" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4">
            {events && events.length > 0 ? (
              events.map((event) => (
                <MessageBubble key={event.id} event={event} />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <div className="mb-2">No messages yet</div>
                <div className="text-sm">Start the conversation!</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message composer */}
      <div className="flex-shrink-0">
        <MessageComposer onMessageSent={handleMessageSent} />
      </div>
    </div>
  );
}