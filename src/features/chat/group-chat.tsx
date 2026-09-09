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

import { FontFamily, Palette, Section } from '@/constants/theme';
import { useChat } from './use-chat';
import type { ChatMessage } from './types';

const EMERALD = Section.groups.color;

type Props = {
  groupId: string;
  userId: string;
  userName: string;
};

export function GroupChat({ groupId, userId, userName }: Props) {
  const { messages, loading, error, send } = useChat(groupId, userId, userName);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  async function onSend() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await send(body);
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
          <ActivityIndicator color={EMERALD} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.message}>{error}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => (
            <Bubble message={item} mine={item.senderId === userId} />
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
          placeholder="Message the group…"
          placeholderTextColor={Palette.inkSoft}
          multiline
          editable={!sending}
        />
        <Pressable
          onPress={onSend}
          disabled={sending || !text.trim()}
          style={({ pressed }) => [
            styles.send,
            (!text.trim() || pressed) && styles.sendMuted,
          ]}>
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowOther]}>
      <View style={{ maxWidth: '82%' }}>
        {!mine ? <Text style={styles.who}>{message.senderName}</Text> : null}
        <View style={[styles.bubble, mine ? styles.mine : styles.other]}>
          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
            {message.body}
          </Text>
        </View>
      </View>
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
  empty: {
    fontFamily: FontFamily.body,
    color: Palette.inkSoft,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
  },
  bubbleRow: { width: '100%' },
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
  mine: { backgroundColor: EMERALD, borderTopRightRadius: 5 },
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
    backgroundColor: EMERALD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendMuted: { opacity: 0.5 },
  sendText: { color: '#FFFFFF', fontSize: 16 },
});
