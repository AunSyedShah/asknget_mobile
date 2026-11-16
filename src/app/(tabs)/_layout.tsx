import { NativeTabs } from 'expo-router/native-tabs';

import { useCart, useNotificationSummary } from '@/api/queries';
import { en } from '@/i18n/en';
import { colors } from '@/theme/tokens';

/**
 * Bottom navbar on the platform's native tab bar (UIKit on iOS, Material on
 * Android). It renders off the JS thread, so a busy screen does not stall tab
 * switching. Android allows at most five tabs; we have exactly five.
 */
export default function TabsLayout() {
  const cart = useCart();
  const notifications = useNotificationSummary();

  const cartCount = cart.data?.summary.item_count ?? 0;
  const unread = notifications.data?.unread ?? 0;

  return (
    <NativeTabs tintColor={colors.brand}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>{en.tabs.home}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="category">
        <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" md="grid_view" />
        <NativeTabs.Trigger.Label>{en.tabs.category}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="inbox">
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right.fill" md="chat" />
        <NativeTabs.Trigger.Label>{en.tabs.inbox}</NativeTabs.Trigger.Label>
        {unread > 0 ? <NativeTabs.Trigger.Badge>{String(unread)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cart">
        <NativeTabs.Trigger.Icon sf="bag.fill" md="shopping_bag" />
        <NativeTabs.Trigger.Label>{en.tabs.cart}</NativeTabs.Trigger.Label>
        {cartCount > 0 ? <NativeTabs.Trigger.Badge>{String(cartCount)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
        <NativeTabs.Trigger.Label>{en.tabs.account}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
