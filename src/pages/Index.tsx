import { useSeoMeta } from '@unhead/react';
import { ChatTimeline } from '@/components/ChatTimeline';

const Index = () => {
  useSeoMeta({
    title: 'Nostr Chat',
    description: 'A Signal-like chat interface for the Nostr protocol.',
  });

  return <ChatTimeline />;
};

export default Index;
