import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { trackOrder } from '@/api/endpoints';
import { ApiError } from '@/api/errors';
import { ComingSoonBadge } from '@/components/coming-soon';
import { Button, Card, ErrorText, SectionHeader, TextField } from '@/components/ui';
import { FeatureGate } from '@/features/feature-gate';
import { en } from '@/i18n/en';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

type Tracked = Awaited<ReturnType<typeof trackOrder>>;

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('en-ZA');
}

/** Track by order number and email. The timeline is real; the map and rider card are coming soon. */
export default function TrackScreen() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<Tracked | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await trackOrder(orderNumber.trim(), email.trim()));
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 404 ? new ApiError(404, en.track.notFound) : caught);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: en.track.title, headerBackTitle: en.common.back }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <TextField label={en.track.orderNumber} value={orderNumber} onChangeText={setOrderNumber} autoCapitalize="characters" />
          <TextField
            label={en.track.email}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <ErrorText error={error} />
          <Button label={en.track.submit} onPress={() => void submit()} loading={loading} disabled={orderNumber.trim() === '' || email.trim() === ''} />
        </Card>

        {result ? (
          <>
            <SectionHeader title={`${result.order_number} · ${result.status_label}`} />
            <Card>
              <Text style={styles.muted}>{formatDate(result.placed_at)}</Text>
              <Text style={styles.body}>
                {en.track.deliveryMethod}: {String((result.delivery_method as { name?: string }).name ?? '—')}
              </Text>
            </Card>

            <SectionHeader title={en.track.timeline} />
            <Card>
              {result.events.length === 0 ? <Text style={styles.body}>{en.track.noEvents}</Text> : null}
              {result.events.map((event, index) => (
                <View key={`${event.status}-${index}`} style={styles.event}>
                  <Text style={styles.strong}>{event.label}</Text>
                  <Text style={styles.muted}>{formatDate(event.created_at)}</Text>
                  {event.note ? <Text style={styles.body}>{event.note}</Text> : null}
                  {event.location ? <Text style={styles.muted}>{event.location}</Text> : null}
                </View>
              ))}
            </Card>

            <FeatureGate feature="liveTracking" comingSoon={<SoonRow label={en.track.liveMap} />}>
              <View />
            </FeatureGate>
          </>
        ) : null}

        <SoonRow label={en.track.contactSupport} />
      </ScrollView>
    </View>
  );
}

function SoonRow({ label }: { label: string }) {
  return (
    <Card>
      <Text style={styles.body}>{label}</Text>
      <ComingSoonBadge />
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, gap: space.sm, paddingBottom: space.xxl },
  event: { gap: 2, paddingVertical: space.xs },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  strong: { color: colors.ink, fontFamily: fontFamily.medium, fontSize: fontSize.body },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
});
