import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, fontSize, space } from '@/theme/tokens';

type EmptyStateProps = {
  title: string;
  body: string;
};

/** Empty state for a list or screen with no data yet. Never shows invented content. */
export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.bodyLg,
    textAlign: 'center',
  },
  body: {
    color: colors.muted,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
});
