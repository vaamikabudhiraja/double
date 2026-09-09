import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import type { ChatMessage } from '@/features/chat/types';
import { blockUser, listBlockedIds, reportUser } from './api';

/**
 * Loads the viewer's block list and returns a long-press handler that offers
 * Block / Report on someone else's message (CLAUDE.md: report/block everywhere).
 * `context` is stored on the report (e.g. "group:<id>") for moderation.
 */
export function useMessageActions(userId: string | undefined, context: string) {
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    listBlockedIds(userId)
      .then((ids) => setBlockedIds(new Set(ids)))
      .catch(() => {});
  }, [userId]);

  const onLongPressMessage = useCallback(
    (message: ChatMessage) => {
      if (!userId || message.senderId === userId) return;
      Alert.alert(message.senderName, 'Keep Tandem safe.', [
        {
          text: `Block ${message.senderName}`,
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(userId, message.senderId);
              setBlockedIds((prev) => new Set(prev).add(message.senderId));
            } catch {
              Alert.alert("Couldn't block", 'Please try again.');
            }
          },
        },
        {
          text: 'Report',
          onPress: async () => {
            try {
              await reportUser(userId, message.senderId, context);
              Alert.alert('Thanks', 'Report sent to the team.');
            } catch {
              Alert.alert("Couldn't report", 'Please try again.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [userId, context],
  );

  return { blockedIds, onLongPressMessage };
}
