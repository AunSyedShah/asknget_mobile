import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { en } from '@/i18n/en';

export default function CartScreen() {
  return (
    <Screen title={en.cart.title}>
      <EmptyState title={en.cart.emptyTitle} body={en.cart.emptyBody} />
    </Screen>
  );
}
