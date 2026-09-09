import { Section } from '@/constants/theme';
import { ChatThread } from './chat-thread';
import { useChat } from './use-chat';

type Props = {
  groupId: string;
  userId: string;
  userName: string;
};

export function GroupChat({ groupId, userId, userName }: Props) {
  const { messages, loading, error, send } = useChat(groupId, userId, userName);
  return (
    <ChatThread
      messages={messages}
      loading={loading}
      error={error}
      currentUserId={userId}
      accent={Section.groups.color}
      onSend={send}
    />
  );
}
