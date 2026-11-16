import { Pressable, StyleSheet, Text, View } from 'react-native';

import { en } from '@/i18n/en';
import { colors, fontFamily, fontSize, radius, space } from '@/theme/tokens';

/** Small pill for buttons, tabs and icons. Inert: it marks, it does not act. */
export function ComingSoonBadge() {
  return (
    <View accessibilityRole="text" style={styles.badge}>
      <Text style={styles.badgeText}>{en.common.comingSoon}</Text>
    </View>
  );
}

type ComingSoonScreenProps = {
  title: string;
  onBack: () => void;
};

/** Full-screen empty state for a whole screen that is not live yet. Shows no fake data. */
export function ComingSoonScreen({ title, onBack }: ComingSoonScreenProps) {
  return (
    <View style={styles.screen}>
      <Pressable accessibilityRole="button" accessibilityLabel={en.common.back} onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>{en.common.back}</Text>
      </Pressable>
      <View style={styles.center}>
        <ComingSoonBadge />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{en.common.comingSoonBody}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.peach,
    borderColor: colors.brand,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  badgeText: {
    color: colors.brand,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: space.lg,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: space.sm,
  },
  backText: {
    color: colors.ink,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.bodyLg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.title,
    textAlign: 'center',
  },
  body: {
    color: colors.muted,
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodyLg,
    textAlign: 'center',
  },
});
