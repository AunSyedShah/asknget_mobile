import { Stack, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useConversations } from '@/api/queries';
import { ComingSoonScreen } from '@/components/coming-soon';
import { RequireSignIn } from '@/components/require-sign-in';
import { Card, ErrorText, Loading } from '@/components/ui';
import { useFeature } from '@/features/feature-gate';
import { en } from '@/i18n/en';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

/** Buyer chat list. A chat starts from "Ask the seller" on a product page. */
export default function ChatsScreen() {
  const state = useFeature('buyerChat');
  const conversations = useConversations();

  if (state !== 'live') {
    return <ComingSoonScreen title={en.chats.title} onBack={() => router.back()} />;
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: en.chats.title, headerBackTitle: en.common.back }} />
      <RequireSignIn>
        <ScrollView contentContainerStyle={styles.content}>
          {conversations.isPending ? <Loading /> : null}
          {conversations.isError ? <ErrorText error={conversations.error} /> : null}
          {conversations.data && conversations.data.items.length === 0 ? <Text style={styles.muted}>{en.chats.empty}</Text> : null}
          {conversations.data?.items.map((conversation) => (
            <Pressable
              key={conversation.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/account/chat/[id]', params: { id: conversation.id } })}
            >
              <Card>
                <Text style={styles.strong}>
                  {conversation.store.name}
                  {conversation.unread > 0 ? ` (${conversation.unread})` : ''}
                </Text>
                {conversation.subject ? <Text style={styles.body}>{conversation.subject}</Text> : null}
                <Text style={styles.muted} numberOfLines={1}>
                  {conversation.last_message_preview}
                </Text>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      </RequireSignIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, gap: space.sm, paddingBottom: space.xxl },
  strong: { color: colors.ink, fontFamily: fontFamily.semibold, fontSize: fontSize.bodyLg },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.body },
});
