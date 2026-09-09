import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FontFamily, Palette } from '@/constants/theme';
import type { ChatMessage } from './types';

type Props = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  currentUserId: string;
  accent: string;
  onSend: (body: string) => Promise<void>;
  /** Optional system line pinned at the top of the thread (e.g. ephemeral note). */
  systemNote?: string;
  /** Sender ids whose messages should be hidden (blocked). */
  blockedIds?: Set<string>;
  /** Long-press on someone else's message (offer block/report). */
  onLongPressMessage?: (message: ChatMessage) => void;
};

/** Presentational chat: message bubbles + an input bar. Data comes from props. */
export function ChatThread({
  messages,
  loading,
  error,
  currentUserId,
  accent,
  onSend,
  systemNote,
  blockedIds,
  onLongPressMessage,
}: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const visible = blockedIds
    ? messages.filter((m) => !blockedIds.has(m.senderId))
    : messages;

  async function handleSend() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await onSend(body);
      setText('');
    } catch {
      // Keep the text so the user can retry.
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.message}>{error}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={visible}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListHeaderComponent={
            systemNote ? <Text style={styles.system}>{systemNote}</Text> : null
          }
          renderItem={({ item }) => (
            <Bubble
              message={item}
              mine={item.senderId === currentUserId}
              accent={accent}
              onLongPress={
                onLongPressMessage ? () => onLongPressMessage(item) : undefined
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No messages yet — say hello 👋</Text>
          }
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message the room…"
          placeholderTextColor={Palette.inkSoft}
          multiline
          editable={!sending}
        />
        <Pressable
          onPress={handleSend}
          disabled={sending || !text.trim()}
          style={({ pressed }) => [
            styles.send,
            { backgroundColor: accent },
            (!text.trim() || pressed) && styles.sendMuted,
          ]}>
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({
  message,
  mine,
  accent,
  onLongPress,
}: {
  message: ChatMessage;
  mine: boolean;
  accent: string;
  onLongPress?: () => void;
}) {
  return (
    <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowOther]}>
      <Pressable
        style={styles.bubbleWrap}
        onLongPress={mine ? undefined : onLongPress}
        delayLongPress={350}>
        {!mine ? <Text style={styles.who}>{message.senderName}</Text> : null}
        <View
          style={[
            styles.bubble,
            mine
              ? [styles.mine, { backgroundColor: accent }]
              : styles.other,
          ]}>
          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
            {message.body}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  message: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 14,
    textAlign: 'center',
  },
  list: { padding: 14, gap: 8, flexGrow: 1 },
  system: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.inkSoft,
    fontSize: 11,
    textAlign: 'center',
    backgroundColor: '#F1EEE7',
    alignSelf: 'center',
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  empty: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
  },
  bubbleRow: { width: '100%' },
  bubbleWrap: { maxWidth: '82%' },
  rowMine: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  who: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.inkSoft,
    fontSize: 10.5,
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: { borderRadius: 15, paddingVertical: 9, paddingHorizontal: 12 },
  mine: { borderTopRightRadius: 5 },
  other: { backgroundColor: '#F1EEE7', borderTopLeftRadius: 5 },
  bubbleText: {
    fontFamily: FontFamily.body,
    color: Palette.ink,
    fontSize: 14,
    lineHeight: 19,
  },
  bubbleTextMine: { color: '#FFFFFF' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    backgroundColor: Palette.card,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1EEE7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Palette.ink,
    maxHeight: 120,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendMuted: { opacity: 0.5 },
  sendText: { color: '#FFFFFF', fontSize: 16 },
});
