import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchName } from '@/features/chat/api';
import type { ChatMessage } from '@/features/chat/types';
import { getSupabase } from '@/lib/supabase';
import { fetchEventMessages, sendEventMessage } from './api';

/** Realtime chat for an event room (mirrors useChat but on event_messages). */
export function useEventChat(
  eventId: string,
  userId: string,
  userName: string,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const names = useRef(new Map<string, string>());

  useEffect(() => {
    let active = true;
    names.current.set(userId, userName);

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const msgs = await fetchEventMessages(eventId);
        if (!active) return;
        msgs.forEach((m) => names.current.set(m.senderId, m.senderName));
        setMessages(msgs);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load messages.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    const channel = getSupabase()
      .channel(`event-messages-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            body: string;
            created_at: string;
            sender_id: string;
          };
          let name = names.current.get(row.sender_id);
          if (!name) {
            name = await fetchName(row.sender_id);
            names.current.set(row.sender_id, name);
          }
          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: row.id,
                    body: row.body,
                    createdAt: row.created_at,
                    senderId: row.sender_id,
                    senderName: name!,
                  },
                ],
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      getSupabase().removeChannel(channel);
    };
  }, [eventId, userId, userName]);

  const send = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const res = await sendEventMessage(eventId, userId, trimmed);
      setMessages((prev) =>
        prev.some((m) => m.id === res.id)
          ? prev
          : [
              ...prev,
              {
                id: res.id,
                body: trimmed,
                createdAt: res.createdAt,
                senderId: userId,
                senderName: userName,
              },
            ],
      );
    },
    [eventId, userId, userName],
  );

  return { messages, loading, error, send };
}
