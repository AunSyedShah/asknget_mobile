import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontFamily, fontSize, gutter, screenGradient, space } from '@/theme/tokens';

type ScreenProps = {
  title: string;
  children: ReactNode;
};

/** Standard screen frame: peach-to-cream gradient, safe areas, title. */
export function Screen({ title, children }: ScreenProps) {
  return (
    <LinearGradient colors={screenGradient} style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
        </View>
        <View style={styles.body}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: gutter,
    paddingVertical: space.md,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.title,
  },
  body: {
    flex: 1,
    paddingHorizontal: gutter,
  },
});
