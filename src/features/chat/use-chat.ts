import { useCallback, useEffect, useRef, useState } from 'react';

import { getSupabase } from '@/lib/supabase';
import { fetchMessages, fetchName, sendMessage } from './api';
import type { ChatMessage } from './types';

/**
 * Loads a group's messages and subscribes to realtime inserts. New messages
 * (yours or others') append live. Sender names are cached to avoid refetching.
 */
export function useChat(
  groupId: string,
  currentUserId: string | undefined,
  currentUserName: string,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const names = useRef(new Map<string, string>());

  useEffect(() => {
    let active = true;
    if (currentUserId) names.current.set(currentUserId, currentUserName);

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const msgs = await fetchMessages(groupId);
        if (!active) return;
        msgs.forEach((m) => names.current.set(m.senderId, m.senderName));
        setMessages(msgs);
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'Could not load messages.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    const channel = getSupabase()
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
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
  }, [groupId, currentUserId, currentUserName]);

  const send = useCallback(
    async (body: string) => {
      if (!currentUserId) throw new Error('Sign in to send messages.');
      const trimmed = body.trim();
      if (!trimmed) return;
      const res = await sendMessage(groupId, currentUserId, trimmed);
      // Optimistic append; the realtime echo dedupes by id.
      setMessages((prev) =>
        prev.some((m) => m.id === res.id)
          ? prev
          : [
              ...prev,
              {
                id: res.id,
                body: trimmed,
                createdAt: res.createdAt,
                senderId: currentUserId,
                senderName: currentUserName,
              },
            ],
      );
    },
    [groupId, currentUserId, currentUserName],
  );

  return { messages, loading, error, send };
}
