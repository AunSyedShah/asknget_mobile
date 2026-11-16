import { Stack } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useReturnsPolicy } from '@/api/queries';
import { Card, ErrorText, Loading } from '@/components/ui';
import { en } from '@/i18n/en';
import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

/** The market's return policy, straight from GET /returns/policy (public). */
export default function ReturnsPolicyScreen() {
  const policy = useReturnsPolicy();
  const data = policy.data;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerShown: true, title: en.returns.title, headerBackTitle: en.common.back }} />
      {policy.isPending ? <Loading /> : null}
      {policy.isError ? <ErrorText error={policy.error} /> : null}
      {data ? (
        <Card>
          <Text style={styles.strong}>
            {en.returns.window}: {data.change_of_mind_days} {en.returns.days}
          </Text>
          <Text style={styles.body}>
            {en.returns.defect}: {data.defect_days} {en.returns.days}
          </Text>
          {data.restocking_fee_bps > 0 ? (
            <Text style={styles.body}>
              {en.returns.restocking}: {(data.restocking_fee_bps / 100).toFixed(2)}%
            </Text>
          ) : null}
          {!data.accepts_returns ? <Text style={styles.body}>{en.returns.notAccepted}</Text> : null}
          {data.summary ? <Text style={styles.body}>{data.summary}</Text> : null}
          {data.terms ? <Text style={styles.muted}>{data.terms}</Text> : null}
          {data.url ? (
            <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(data.url)}>
              <Text style={styles.link}>{data.url}</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: space.lg, gap: space.md },
  strong: { color: colors.ink, fontFamily: fontFamily.semibold, fontSize: fontSize.bodyLg },
  body: { color: colors.ink, fontFamily: fontFamily.body, fontSize: fontSize.body },
  muted: { color: colors.muted, fontFamily: fontFamily.body, fontSize: fontSize.caption },
  link: { color: colors.brand, fontFamily: fontFamily.medium, fontSize: fontSize.body },
});
