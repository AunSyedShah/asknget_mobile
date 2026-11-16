import { useQueryClient } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';

import { markConversationRead, sendMessage } from '@/api/endpoints';
import { ApiError } from '@/api/errors';
import { keys, useConversation } from '@/api/queries';
import { ComingSoonScreen } from '@/components/coming-soon';
import { RequireSignIn } from '@/components/require-sign-in';
import { Button, ErrorText, Loading, TextField } from '@/components/ui';
import { useFeature } from '@/features/feature-gate';
import { en } from '@/i18n/en';
import { colors, fontFamily, fontSize, radius, space } from '@/theme/tokens';

/** One chat thread. Polls every 5 seconds while open (no WebSocket on the server). */
export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useFeature('buyerChat');
  const queryClient = useQueryClient();
  const thread = useConversation(id ?? '');
  const [text, setText] = useState('');
  const [failure, setFailure] = useState<unknown>(null);
  const [sending, setSending] = useState(false);
  const scroller = useRef<ScrollViewInstance>(null);

  const messageCount = thread.data?.messages.length ?? 0;
  const unread = thread.data?.unread ?? 0;

  // Mark the thread read when it opens and whenever a new message arrives.
  useEffect(() => {
    if (id && unread > 0) {
      void markConversationRead(id).then(() => queryClient.invalidateQueries({ queryKey: keys.conversations }));
    }
  }, [id, unread, queryClient]);

  useEffect(() => {
    scroller.current?.scrollToEnd({ animated: true });
  }, [messageCount]);

  if (state !== 'live') {
    return <ComingSoonScreen title={en.chats.title} onBack={() => router.back()} />;
  }

  async function send() {
    const body = text.trim();
    if (body === '' || !id) return;
    setSending(true);
    setFailure(null);
    try {
      await sendMessage(id, body);
      setText('');
      await queryClient.invalidateQueries({ queryKey: keys.conversation(id) });
    } catch (error) {
      setFailure(error instanceof ApiError && error.status === 429 ? new ApiError(429, en.chats.rateLimit) : error);
    } finally {
      setSending(false);
    }
  }

  const data = thread.data;
  const canSend = data ? !data.closed && data.seller_can_reply !== false : false;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: true, title: data?.store.name ?? en.chats.title, headerBackTitle: en.common.back }} />
      <RequireSignIn>
        <ScrollView ref={scroller} contentContainerStyle={styles.messages}>
          {thread.isPending ? <Loading /> : null}
          {thread.isError ? <ErrorText error={thread.error} /> : null}
          {data?.messages.map((message) => {
            const mine = message.sender_role === 'customer' || message.sender_role === 'buyer';
            return (
              <View key={message.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.messageText, mine && styles.mineText]}>{message.body}</Text>
                <Text style={[styles.time, mine && styles.mineText]}>{new Date(message.created_at).toLocaleTimeString('en-ZA')}</Text>
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.composer}>
          {data?.closed ? <Text style={styles.muted}>{en.chats.closed}</Text> : null}
          {data && !data.closed && !data.seller_can_reply ? <Text style={styles.muted}>{en.chats.cannotReply}</Text> : null}
          <ErrorText error={failure} />
          <TextField label={en.chats.typeMessage} value={text} onChangeText={setText} multiline maxLength={4000} editable={canSend} />
          <Button label={en.chats.send} onPress={() => void send()} loading={sending} disabled={!canSend || text.trim() === ''} />
        </View>
      </RequireSignIn>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  messages: { padding: space.lg, gap: space.sm },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, padding: space.md, gap: 2 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.brand },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.white },
  messageText: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  mineText: { color: colors.white },
  time: { color: colors.muted, fontFamily: fontFamily.body, fontSize: 10 },
  composer: { padding: space.lg, gap: space.sm, backgroundColor: colors.cream },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
});
