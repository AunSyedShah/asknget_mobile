import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { markAllNotificationsRead, markNotificationRead } from '@/api/endpoints';
import { keys, useNotificationSummary, useNotifications } from '@/api/queries';
import { ComingSoonBadge } from '@/components/coming-soon';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Button, ErrorText, Loading } from '@/components/ui';
import { FeatureGate } from '@/features/feature-gate';
import { en } from '@/i18n/en';
import { useSession } from '@/state/session';
import { colors, fontFamily, fontSize, radius, space } from '@/theme/tokens';

type Tab = 'all' | 'orders' | 'returns';

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: en.inbox.all },
  { value: 'orders', label: en.inbox.orders },
  { value: 'returns', label: en.inbox.returns },
];

/** Notifications by polling (the live bell is off on the server). */
export default function InboxScreen() {
  const signedIn = useSession((state) => state.accessToken !== null);
  const [tab, setTab] = useState<Tab>('all');
  const notifications = useNotifications(tab);
  const summary = useNotificationSummary();
  const queryClient = useQueryClient();

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    await queryClient.invalidateQueries({ queryKey: keys.notificationSummary });
  }

  if (!signedIn) {
    return (
      <Screen title={en.inbox.title}>
        <EmptyState title={en.account.signedOutTitle} body={en.account.signedOutBody} />
        <Button label={en.common.signIn} onPress={() => router.push('/auth/login')} />
      </Screen>
    );
  }

  return (
    <Screen title={en.inbox.title}>
      <View style={styles.tabs}>
        {TABS.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === item.value }}
            onPress={() => setTab(item.value)}
            style={[styles.tab, tab === item.value && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === item.value && styles.tabTextActive]}>
              {item.label}
              {item.value === 'all' && summary.data && summary.data.unread > 0 ? ` (${summary.data.unread})` : ''}
            </Text>
          </Pressable>
        ))}
        <FeatureGate feature="inboxPromos" comingSoon={<SoonTab label={en.inbox.promos} />}>
          <View />
        </FeatureGate>
        <FeatureGate feature="inboxCoupons" comingSoon={<SoonTab label={en.inbox.coupons} />}>
          <View />
        </FeatureGate>
        <FeatureGate feature="inboxPriceDrops" comingSoon={<SoonTab label={en.inbox.priceDrops} />}>
          <View />
        </FeatureGate>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await markAllNotificationsRead();
            await refresh();
          }}
        >
          <Text style={styles.link}>{en.inbox.markAll}</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push('/account/chats')}>
          <Text style={styles.link}>{en.inbox.chats}</Text>
        </Pressable>
      </View>

      {notifications.isPending ? <Loading /> : null}
      {notifications.isError ? <ErrorText error={notifications.error} /> : null}
      {notifications.data && notifications.data.items.length === 0 ? (
        <EmptyState title={en.inbox.empty} body={en.inbox.emptyBody} />
      ) : null}
      <FlatList
        data={notifications.data?.items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              if (!item.is_read) {
                await markNotificationRead(item.id);
                await refresh();
              }
            }}
            style={[styles.card, !item.is_read && styles.cardUnread]}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.muted}>{new Date(item.created_at).toLocaleString('en-ZA')}</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

function SoonTab({ label }: { label: string }) {
  return (
    <View style={styles.soonTab}>
      <Text style={styles.tabText}>{label}</Text>
      <ComingSoonBadge />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  tab: { paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  tabText: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.caption },
  tabTextActive: { color: colors.white, fontFamily: fontFamily.medium },
  soonTab: { flexDirection: 'row', alignItems: 'center', gap: space.xs, opacity: 0.7 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.sm },
  link: { color: colors.brand, fontFamily: fontFamily.medium, fontSize: fontSize.body },
  list: { gap: space.sm, paddingBottom: space.xxl },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: space.lg, gap: space.xs },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: colors.brand },
  title: { color: colors.ink, fontFamily: fontFamily.medium, fontSize: fontSize.bodyLg },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
});
