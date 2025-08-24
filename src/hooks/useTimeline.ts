import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

export function useTimeline(limit = 50) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['timeline', limit],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query([
        {
          kinds: [1], // text notes
          limit,
        }
      ], { signal });

      // Sort by created_at descending (newest first, but we'll reverse for chat UI)
      return events.sort((a, b) => a.created_at - b.created_at);
    },
    refetchInterval: 10000, // Refetch every 10 seconds for real-time feel
  });
}